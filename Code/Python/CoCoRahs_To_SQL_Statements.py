#!/usr/bin/env python3

"""
@fileoverview
Processes CoCoRaHS precipitation observation data and converts it into SQL `INSERT` statements
for the `PrecipitationRecords` table.

Features:
- Loads and validates station observation CSVs and a location master dataset
- Normalizes and matches station names to counties, states, and regions
- Writes unmatched stations to a correction CSV for user mapping
- Applies corrections and generates SQL output for database import

Usage:
    python CoCoRahs_ToSQL_Statements.py first_run     # Detects unmatched stations and writes them to Corrections.csv
    python CoCoRahs_ToSQL_Statements.py check_edits   # Validates entries in Corrections.csv
    python CoCoRahs_ToSQL_Statements.py final_run     # Generates SQL insert statements
"""

import pandas as pd
import re
import argparse

# File paths
MASTER_FILE = "ProjectDataMaster.csv"       # Master sheet with county, state, and region info
OBSERVATION_FILE = "DailyPrecipReports_VT_2023-12-10_1.csv"  # Observation data file
CORRECTIONS_FILE = "Corrections.csv"        # User-provided corrections
OUTPUT_FILE = "VermontYearlyReport.sql"     # Final SQL output file

# Constants
STATE_NAME = "vermont"  # Ensure this matches normalized values in master data
DIRECTIONAL_PREFIXES = ["east", "west", "north", "south"]

REQUIRED_MASTER_COLUMNS = {'City/Town', 'State', 'CountyID', 'StateID', 'RegionID'}
REQUIRED_OBSERVATION_COLUMNS = {'StationName', 'DateTimeStamp', 'TotalPrecipAmt'}

def clean_name(name):
    """
    Cleans and standardizes city/station names:
    - Removes digits and punctuation
    - Strips directional prefixes (e.g., "North Springfield" → "Springfield")
    - Converts to title case
    """
    if pd.isna(name):
        return None
    name = re.split(r'\d', name, 1)[0].strip().lower()
    name = re.sub(rf'^({"|".join(DIRECTIONAL_PREFIXES)})\s+', '', name)
    name = re.sub(r'[^\w\s]', '', name)
    return name.title()

def load_and_validate_data():
    """
    Loads the master and observation CSVs, checks for required columns,
    and applies name standardization and formatting.
    
    @returns: Tuple of (master_df, observations_df)
    """
    try:
        master_df = pd.read_csv(MASTER_FILE)
        observations_df = pd.read_csv(OBSERVATION_FILE)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        exit()

    if not REQUIRED_MASTER_COLUMNS.issubset(master_df.columns):
        missing = REQUIRED_MASTER_COLUMNS - set(master_df.columns)
        print(f"Error: ProjectDataMaster.csv is missing required columns: {missing}")
        exit()

    if not REQUIRED_OBSERVATION_COLUMNS.issubset(observations_df.columns):
        missing = REQUIRED_OBSERVATION_COLUMNS - set(observations_df.columns)
        print(f"Error: Observation CSV is missing required columns: {missing}")
        exit()

    master_df['City/Town'] = master_df['City/Town'].apply(clean_name)
    master_df['State'] = master_df['State'].str.strip().str.lower()
    master_df['CountyID'] = master_df['CountyID'].astype(str).zfill(3)
    observations_df['StationName'] = observations_df['StationName'].apply(clean_name)

    return master_df, observations_df

def collect_unmatched(master_df, observations_df):
    """
    Detects observation stations not matched in the master dataset.
    Writes unmatched names to a correction CSV file for user input.
    """
    unmatched = []
    for station_name in observations_df['StationName'].unique():
        match = master_df[
            (master_df['City/Town'] == station_name) & (master_df['State'] == STATE_NAME)
        ]
        if match.empty:
            unmatched.append({'StationName': station_name, 'CountyID': ''})

    unmatched_df = pd.DataFrame(unmatched)
    unmatched_df.to_csv(CORRECTIONS_FILE, index=False)
    print(f"Unmatched stations written to {CORRECTIONS_FILE}. Please update it with County IDs.")

def validate_corrections(master_df):
    """
    Loads the Corrections.csv and checks whether the user-supplied CountyIDs
    map correctly to existing master records.
    """
    try:
        corrections_df = pd.read_csv(CORRECTIONS_FILE)
    except FileNotFoundError:
        print(f"Error: Corrections file {CORRECTIONS_FILE} not found.")
        return

    for _, row in corrections_df.iterrows():
        station_name = row['StationName']
        county_id = str(row['CountyID']).zfill(3)
        match = master_df[
            (master_df['CountyID'] == county_id) & (master_df['State'] == STATE_NAME)
        ]
        if match.empty:
            print(f"Warning: County ID '{county_id}' for station '{station_name}' is invalid.")
        else:
            print(f"Station '{station_name}' mapped to County ID '{county_id}'.")

def generate_queries(master_df, observations_df):
    """
    Matches observation stations to county/state/region records.
    Applies user-provided corrections if available.
    Outputs the final SQL INSERT statements to a file.
    """
    try:
        corrections_df = pd.read_csv(CORRECTIONS_FILE)
        corrections = dict(zip(corrections_df['StationName'], corrections_df['CountyID']))
    except FileNotFoundError:
        corrections = {}

    queries = []
    for _, row in observations_df.iterrows():
        station_name = row['StationName']
        timestamp = row['DateTimeStamp']
        precipitation_amount = row['TotalPrecipAmt']

        if pd.isna(timestamp):
            print(f"Skipping row with missing timestamp: {row}")
            continue

        # Normalize precipitation value
        precipitation_amount = (
            0 if pd.isna(precipitation_amount) or str(precipitation_amount).strip().upper() in ["NA", "T"]
            else float(precipitation_amount)
        )

        if station_name in corrections:
            county_id = corrections[station_name]
            match = master_df[
                (master_df['CountyID'] == county_id) & (master_df['State'] == STATE_NAME)
            ]
        else:
            match = master_df[
                (master_df['City/Town'] == station_name) & (master_df['State'] == STATE_NAME)
            ]

        if match is not None and not match.empty:
            county_id = match.iloc[0]['CountyID']
            state_id = match.iloc[0]['StateID']
            region_id = match.iloc[0]['RegionID']

            query = f"""
            INSERT INTO PrecipitationRecords (timestamp, precipitation_amount, county_id, state_id, region_id)
            VALUES ('{timestamp}'::TIMESTAMP, {precipitation_amount}, '{county_id}', '{state_id}', {region_id});
            """
            queries.append(query.strip())

    with open(OUTPUT_FILE, "w") as f:
        f.write("\n".join(queries))
    print(f"SQL file generated: {OUTPUT_FILE}")

def main():
    """
    CLI entry point.
    Accepts a mode: first_run, check_edits, or final_run.
    Dispatches to the appropriate operation.
    """
    parser = argparse.ArgumentParser(description="Process precipitation observation data.")
    parser.add_argument("mode", choices=["first_run", "check_edits", "final_run"], help="Mode to run the script in.")
    args = parser.parse_args()

    master_df, observations_df = load_and_validate_data()

    if args.mode == "first_run":
        collect_unmatched(master_df, observations_df)
    elif args.mode == "check_edits":
        validate_corrections(master_df)
    elif args.mode == "final_run":
        generate_queries(master_df, observations_df)

if __name__ == "__main__":
    main()
# End of script
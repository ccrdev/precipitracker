# Author Cody C. Rosa
# Date 12/11/2024
# This script processes precipitation observation data from a CSV file,
# matches it with a master dataset containing location details (counties, states, regions),
# and generates SQL queries to insert the data into a database.
# Also handles missing or mismatched data by prompting the user to provide corrections or additional input.

import pandas as pd
import re
import argparse

# File paths
MASTER_FILE = "ProjectDataMaster.csv" # Master sheet with county, state, and region info
OBSERVATION_FILE = "DailyPrecipReports_VT_2023-12-10_1.csv" # Observation data
CORRECTIONS_FILE = "Corrections.csv" # Corrections data
OUTPUT_FILE = "VermontYearlyReport.sql" # Output SQL file for precipitation records

# Hardcoded state value (e.g., 'vermont')
STATE_NAME = "vermont" # Ensure this matches the 'State' column in ProjectDataMaster.csv after normalization

# Directional prefixes to remove
DIRECTIONAL_PREFIXES = ["east", "west", "north", "south"]

# Required columns
REQUIRED_MASTER_COLUMNS = {'City/Town', 'State', 'CountyID', 'StateID', 'RegionID'}
REQUIRED_OBSERVATION_COLUMNS = {'StationName', 'DateTimeStamp', 'TotalPrecipAmt'}

# Helper function to clean and standardize city names
def clean_name(name):
    if pd.isna(name):
        return None
    name = re.split(r'\d', name, 1)[0].strip().lower()
    name = re.sub(rf'^({"|".join(DIRECTIONAL_PREFIXES)})\s+', '', name)
    name = re.sub(r'[^\w\s]', '', name)
    return name.title()

# Load data and validate required columns
def load_and_validate_data():
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
    master_df['CountyID'] = master_df['CountyID'].astype(str).str.zfill(3)
    observations_df['StationName'] = observations_df['StationName'].apply(clean_name)

    return master_df, observations_df

# First run: Collect unmatched stations
def collect_unmatched(master_df, observations_df):
    unmatched = []
    for station_name in observations_df['StationName'].unique():
        matching_row = master_df[
            (master_df['City/Town'] == station_name) & (master_df['State'] == STATE_NAME)
        ]
        if matching_row.empty:
            unmatched.append({'StationName': station_name, 'CountyID': ''})

    unmatched_df = pd.DataFrame(unmatched)
    unmatched_df.to_csv(CORRECTIONS_FILE, index=False)
    print(f"Unmatched stations written to {CORRECTIONS_FILE}. Please update it with County IDs.")

# Check edits: Validate corrections
def validate_corrections(master_df):
    try:
        corrections_df = pd.read_csv(CORRECTIONS_FILE)
    except FileNotFoundError:
        print(f"Error: Corrections file {CORRECTIONS_FILE} not found.")
        return

    for _, row in corrections_df.iterrows():
        station_name = row['StationName']
        county_id = str(row['CountyID']).zfill(3)
        matching_row = master_df[
            (master_df['CountyID'] == county_id) & (master_df['State'] == STATE_NAME)
        ]
        if matching_row.empty:
            print(f"Warning: County ID '{county_id}' for station '{station_name}' is invalid.")
        else:
            print(f"Station '{station_name}' mapped to County ID '{county_id}'.")

# Final run: Generate SQL queries
def generate_queries(master_df, observations_df):
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

        precipitation_amount = (
            0 if pd.isna(precipitation_amount) or str(precipitation_amount).strip().upper() in ["NA", "T"]
            else float(precipitation_amount)
        )

        if station_name in corrections:
            county_id = corrections[station_name]
            matching_row = master_df[
                (master_df['CountyID'] == county_id) & (master_df['State'] == STATE_NAME)
            ]
        else:
            matching_row = master_df[
                (master_df['City/Town'] == station_name) & (master_df['State'] == STATE_NAME)
            ]

        if matching_row is not None and not matching_row.empty:
            county_id = matching_row.iloc[0]['CountyID']
            state_id = matching_row.iloc[0]['StateID']
            region_id = matching_row.iloc[0]['RegionID']

            query = f"""
            INSERT INTO PrecipitationRecords (timestamp, precipitation_amount, county_id, state_id, region_id)
            VALUES ('{timestamp}'::TIMESTAMP, {precipitation_amount}, '{county_id}', '{state_id}', {region_id});
            """
            queries.append(query.strip())

    with open(OUTPUT_FILE, "w") as f:
        f.write("\n".join(queries))
    print(f"SQL file generated: {OUTPUT_FILE}")

# Main execution
def main():
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

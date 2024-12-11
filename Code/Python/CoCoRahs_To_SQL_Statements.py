# Author Cody C. Rosa
# Date 12/11/2024
# This script processes precipitation observation data from a CSV file,
# matches it with a master dataset containing location details (counties, states, regions),
# and generates SQL queries to insert the data into a database.
# Also handles missing or mismatched data by prompting the user to provide corrections or additional input.

import pandas as pd
import re

# File paths
MASTER_FILE = "ProjectDataMaster.csv"  # Master sheet with county, state, and region info
OBSERVATION_FILE = "DailyPrecipReports_VT_2023-12-10_1.csv"  # Observation data
OUTPUT_FILE = "VTearlyReport.sql"  # Output SQL file for precipitation records

# Hardcoded state value (e.g., 'alabama')
STATE_NAME = "vermont"  # Ensure this matches the 'State' column in MASTER_FINAL.csv after normalization

# Directional prefixes to remove
DIRECTIONAL_PREFIXES = ["east", "west", "north", "south"]

# Required columns
REQUIRED_MASTER_COLUMNS = {'City/Town', 'State', 'CountyID', 'StateID', 'RegionID'}
REQUIRED_OBSERVATION_COLUMNS = {'StationName', 'DateTimeStamp', 'TotalPrecipAmt'}

# Dictionaries for user corrections and county mappings
user_corrections = {}
county_code_mapping = {}

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
        print(f"Error: MASTER_FINAL.csv is missing required columns: {missing}")
        exit()

    if not REQUIRED_OBSERVATION_COLUMNS.issubset(observations_df.columns):
        missing = REQUIRED_OBSERVATION_COLUMNS - set(observations_df.columns)
        print(f"Error: precipdata.csv is missing required columns: {missing}")
        exit()

    # Clean master data
    master_df['City/Town'] = master_df['City/Town'].apply(clean_name)
    master_df['State'] = master_df['State'].str.strip().str.lower()
    master_df['CountyID'] = master_df['CountyID'].astype(str).str.zfill(3)

    # Clean observation data
    observations_df['StationName'] = observations_df['StationName'].apply(clean_name)

    return master_df, observations_df

# Handle unmatched station names
def handle_unmatched_station(station_name, master_df):
    while True:
        print(f"Warning: '{station_name}' was not found in MASTER_FINAL.csv.")
        user_input = input(f"Enter the correct name, a three-digit County ID, or press Enter to skip: ").strip()

        if not user_input:
            print(f"Skipping '{station_name}'...")
            return None

        if user_input.isdigit() and len(user_input) == 3:
            county_id = user_input.zfill(3)
            matching_row = master_df[
                (master_df['CountyID'] == county_id) & (master_df['State'] == STATE_NAME)
            ]
            if not matching_row.empty:
                county_code_mapping[station_name] = county_id
                print(f"County ID mapping saved for '{station_name}': '{county_id}'.")
                return matching_row
            else:
                print(f"County ID '{user_input}' is not valid for the state '{STATE_NAME}'.")
        else:
            corrected_name = clean_name(user_input)
            user_corrections[station_name] = corrected_name
            matching_row = master_df[
                (master_df['City/Town'] == corrected_name) & (master_df['State'] == STATE_NAME)
            ]
            if not matching_row.empty:
                return matching_row
            else:
                print(f"'{corrected_name}' could not be found. Please try again.")

# Generate SQL queries from observations
def generate_queries(master_df, observations_df):
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

        if station_name in user_corrections:
            corrected_name = user_corrections[station_name]
            matching_row = master_df[
                (master_df['City/Town'] == corrected_name) & (master_df['State'] == STATE_NAME)
            ]
        elif station_name in county_code_mapping:
            county_id = county_code_mapping[station_name]
            matching_row = master_df[
                (master_df['CountyID'] == county_id) & (master_df['State'] == STATE_NAME)
            ]
        else:
            matching_row = master_df[
                (master_df['City/Town'] == station_name) & (master_df['State'] == STATE_NAME)
            ]
            if matching_row.empty:
                matching_row = master_df[
                    master_df['City/Town'].str.contains(re.escape(station_name), case=False, na=False) &
                    (master_df['State'] == STATE_NAME)
                ]

            if matching_row.empty:
                matching_row = handle_unmatched_station(station_name, master_df)

        if matching_row is not None and not matching_row.empty:
            county_id = matching_row.iloc[0]['CountyID']
            state_id = matching_row.iloc[0]['StateID']
            region_id = matching_row.iloc[0]['RegionID']

            query = f"""
            INSERT INTO PrecipitationRecords (timestamp, precipitation_amount, county_id, state_id, region_id)
            VALUES ('{timestamp}'::TIMESTAMP, {precipitation_amount}, '{county_id}', '{state_id}', {region_id});
            """
            queries.append(query.strip())

    return queries

# Main execution
def main():
    master_df, observations_df = load_and_validate_data()
    queries = generate_queries(master_df, observations_df)
    with open(OUTPUT_FILE, "w") as f:
        f.write("\n".join(queries))
    print(f"SQL file generated: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()

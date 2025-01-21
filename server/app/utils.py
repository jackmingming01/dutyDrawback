import json
import os

DATA_FILE = os.path.join(os.path.dirname(__file__), '../data/dutydrawback_claims.json')

def read_data():
    if not os.path.exists(DATA_FILE):
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, "w") as file:
            json.dump([], file)  # Initialize an empty JSON array
    with open(DATA_FILE, "r") as file:
        return json.load(file)

def write_data(data):
    with open(DATA_FILE, "w") as file:
        json.dump(data, file, indent=4)

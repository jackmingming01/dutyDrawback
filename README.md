# This is a duty drawback HTS Code filter app

1, How to start:
    - Start server: 
      - open server folder
      - install deps: `pip3 install --upgrade -r requirements.txt`
      - start server: server will be start on port 8000,  `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
    
    - Start filter (client)
      - open filter folder
      - please make sure you have nodejs installed in your operation system
      - install deps: `npm install` or `pnpm install`
      - start dev server: server will be on port 3000,  `npm run dev` or `pnpm run dev`

    - Open broswer and type localhost:3000, you will see the UI.

2, Features:
    - Search Capabilities:
       - Search by HTS Code, time range, or both simultaneously.
    - Auto-complete: 
       - Provides suggestions while typing in search fields.
    - Time Range Support:
       - Multiple time ranges with validation to prevent overlaps.
       - Specific time points like:
          -twoWeeksBeforeToNow
          -oneWeekBeforeToNow
          -last30DaysToNow
          -last60DaysToNow
          -last90DaysToNow
          -last1CalendarMonth
          -last2CalendarMonths
          -last3CalendarMonths
    - HTS Code Filtering:
      - Wildcard Mode: e.g., %d123.%d2.3%d.5%d, *.12.34.12
      - Exact Mode: e.g., 1234.56.78.91
      - Multiple HTS Codes: e.g., 1231.14.34.12,2345.23.35.65
      - Live Validation and Format: Ensures correct HTS code format in real-time.
    - User Interaction:
      - Add search parameters to a badge area by clicking the "Add" button.
      - Initiate search by clicking the "Search" button.

3, How to Use:
    - Enter Search Criteria:
      - Type Date or HTS in the search box. Use Tab or Enter to select from auto-complete options.
      - Depending on your selection:
        - For Date, you'll see a date picker.
        - For HTS, you'll get an input for HTS codes.
        - For specific time points, no additional input is needed.
    - Add Search Parameters:
      - Click the 'Add' button to add your criteria to the badge area.
    - Perform Search:
      - Click 'Search' to fetch and display data based on your parameters.
    - Reset Search:
      - Click 'Reset' to clear all search criteria and start anew.

4, Enjoy!
    - Feel free to explore and use the app to streamline your duty drawback claims process!

    

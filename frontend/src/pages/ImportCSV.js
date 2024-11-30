import React, { useState } from 'react';
import Papa from 'papaparse';

const ImportCSV = () => {
    const [csvData, setCsvData] = useState(null);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    setCsvData(results.data);
                },
                error: (error) => {
                    console.error('Error parsing CSV:', error);
                }
            });
        }
    };

    return (
        <div>
            <h1>Import CSV</h1>
            <input type="file" accept=".csv" onChange={handleFileUpload} />
            {csvData && (
                <div>
                    <h2>CSV Data</h2>
                    <pre>{JSON.stringify(csvData, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default ImportCSV;
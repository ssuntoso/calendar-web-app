import React from 'react';
import Papa from 'papaparse';
import { Cookies } from 'react-cookie';

const cookies = new Cookies();
const backendEndpoint = `${process.env.REACT_APP_API_URL}${process.env.REACT_APP_API_VERSION}${process.env.REACT_APP_API_EVENT}`;

const formatDate = (date) => {
    // format date object to 'YYYY-MM-DD HH:MM:SS'
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
  }

const ImportCSV = () => {
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    // get largest subject_id
                    fetch(`${backendEndpoint}/getSubjects?user_id=${cookies.get('auth').user_id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'authorization': `Bearer ${cookies.get('auth').token}`
                        }
                    }).then(response => response.json())
                        .then(data => {
                            let startIndex = 0;
                            if (data.length > 0) {
                                startIndex = data[data.length - 1].subject_id;
                            } 
                            // create event_data array
                            const events_data = results.data.map((data, index) => ({
                                user_id: cookies.get('auth').user_id,
                                subject_id: index + startIndex + 1,
                                subject: data.subject,
                                start_time_zone: data.start_time_zone,
                                start_time: formatDate(new Date(data.start_time)),
                                end_time_zone: data.end_time_zone,
                                end_time: formatDate(new Date(data.end_time)),
                                all_day_event: data.all_day_event,
                                description: data.description,
                                location: data.location
                            }));
                            // post request to addSubject
                            fetch(`${backendEndpoint}/addSubject`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${cookies.get('auth').token}`
                                },
                                body: JSON.stringify(events_data)
                            }).then(response => response.json())
                                .then(data => {
                                    if (data?.message) {
                                        alert(data.message);
                                        return;
                                    } else {
                                        window.location.href = '/';
                                    }
                                })
                                .catch((error) => console.error('Error:', error));
                        })
                        .catch((error) => console.error('Error:', error));
                },
                error: (error) => {
                    console.error('Error parsing CSV:', error);
                }
            });
        }
    };

    return (
        <div className="import-csv-container p-4 text-center mt-10 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-8">Import CSV</h1>
            <div class="flex items-center justify-center w-full">
                <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click to upload</span> or drag and drop</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                    </div>
                    <input id="dropzone-file" type="file" accept=".csv" onChange={handleFileUpload} class="hidden" />
                </label>
            </div> 
        </div>
    );
};

export default ImportCSV;
const express = require('express');
const app = express();
const port = 3000;

const Skud = require('./modules/Skud');


const skudClient = new Skud('http://skud/LNetworkServer/LNetworkService.svc?singleWsdl', 'your_location', 'admin', '');


skudClient.connect()
    .then((connected) => {
        if (connected) {
            console.log('Connected to SKUD system');

            // Example usage: Add an employee
            skudClient.addEmployee('employee_group_id', 'John', 'Doe')
                .then((employee) => {
                    if (employee) {
                        console.log('Employee added:', employee);
                    } else {
                        console.log('Failed to add employee');
                    }
                })
                .catch((error) => {
                    console.error('Error adding employee:', error);
                });

            // Example usage: Get events
            skudClient.getEvents()
                .then((events) => {
                    if (events) {
                        console.log('Events retrieved:', events);
                    } else {
                        console.log('No events retrieved');
                    }
                })
                .catch((error) => {
                    console.error('Error retrieving events:', error);
                });

            // Disconnect from the SKUD system
            skudClient.disconnect()
                .then((disconnected) => {
                    if (disconnected) {
                        console.log('Disconnected from SKUD system');
                    } else {
                        console.log('Failed to disconnect');
                    }
                })
                .catch((error) => {
                    console.error('Error disconnecting:', error);
                });
        } else {
            console.log('Failed to connect to SKUD system');
        }
    })
    .catch((error) => {
        console.error('Error connecting to SKUD system:', error);
    });



app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Web service listening at http://localhost:${port}`);
});

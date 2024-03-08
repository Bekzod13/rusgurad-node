const express = require('express');
const app = express();
const port = 3000;

const Skud = require('./modules/Skud');

const skudClient = createSkud(
  'http://skud/LNetworkServer/LNetworkService.svc?singleWsdl', 
  '/', 
  'admin', 
  ''
);

skudClient.connect()
    .then((connected) => {
        if (connected) {
            console.log('Connected to SKUD system');

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

            skudClient.disconnect
          }});



app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Web service listening at http://localhost:${port}`);
});

const soap = require('soap');
const axios = require('axios');
const { create } = require('xmlbuilder2');

class Skud {
    constructor(url, location, login, password) {
        this.url = url;
        this.location = location;
        this.login = login;
        this.password = password;
        this.connectionId = null;
        this.soapClient = null;
    }

    async addHeader() {
        const created = new Date().toISOString();
        const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      
        const securityHeader = create({ version: '1.0', encoding: 'UTF-8' })
          .ele('NS1:Security', { 'xmlns:NS1': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd' })
          .ele('NS2:Timestamp', { 'xmlns:NS2': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd' })
          .ele('Created', { 'xmlns': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd' })
          .txt(created)
          .up()
          .ele('Expires', { 'xmlns': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd' })
          .txt(expires)
          .up()
          .ele('NS1:UsernameToken', { 'xmlns': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd' })
          .ele('Username')
          .txt('your_username')
          .up()
          .ele('Password')
          .txt(this.password)
          .up()
          .up()
          .up()
          .up()
          .end({ prettyPrint: true });
      
        const soapEnvelope = create({ version: '1.0', encoding: 'UTF-8' })
          .ele('soapenv:Envelope', { 'xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/', 'xmlns:ns': 'your_namespace' })
          .ele('soapenv:Header')
          .raw(securityHeader)
          .up()
          .ele('soapenv:Body')
          // Add your SOAP request body here
          .end({ prettyPrint: true });
      
        try {
          const response = await axios.post('your_soap_endpoint', soapEnvelope, {
            headers: {
              'Content-Type': 'text/xml',
              'SOAPAction': 'your_soap_action',
              'Authorization': 'your_authorization_header',
            },
          });
      
          // Process the SOAP response
          console.log(response.data);
        } catch (error) {
          console.error('Error making SOAP request:', error);
        }
    }

    async getSoap() {
        if (!this.soapClient) {
            this.soapClient = await soap.createClientAsync(this.url, {
                wsdl_options: {
                    cache: 'none'
                }
            });
            if (this.location) {
                this.soapClient.setEndpoint(this.location);
            }
        }
        return this.soapClient;
    }

    async connect() {
        try {
            if (!this.connectionId) {
                await this.addHeader();
                const connectionResult = await this.getSoap().ConnectAsync();
                this.connectionId = connectionResult.ConnectResult;
            }
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
    

    async disconnect() {
        try {
            const result = await this.getSoap().DisconnectAsync();
            return result !== null;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async addEmployee(groupId, firstName = 'Гость', lastName = 'Гость', secondName = '') {
        let result = null;
        try {
            const data = {
                employeeGroupID: groupId,
                data: {
                    FirstName: firstName,
                    LastName: lastName,
                    SecondName: secondName,
                    CreationDateTime: new Date().toISOString(),
                    EmployeeGroupID: groupId
                }
            };
            await this.addHeader(); // Assuming addHeader is an asynchronous method
    
            const response = await this.getSoap().AddAcsEmployeeAsync({ data });
    
            result = new Employee(response.AddAcsEmployeeResult);
        } catch (ex) {
            this.logError();
        }
        return result;
    }

    async getEvents(from = null, to = null, inout = null, page = 1, pageSize = 20) {
        let msgSubTypes = [];
        switch (inout) {
            case 0:
                msgSubTypes.push('AccessPointEntryByKey');
                break;
            case 1:
                msgSubTypes.push('AccessPointExitByKey');
                break;
        }
        if (from === null) {
            from = new Date().toISOString();
        }
        if (to === null) {
            to = new Date().toISOString();
        }

        await this.addHeader(); 
        try {
            const result = await this.getSoap().GetEventsAsync({
                fromDateTime: from,
                toDateTime: to,
                pageNumber: page,
                pageSize: pageSize,
                msgSubTypes: msgSubTypes
            });

            if (result.GetEventsResult) {
                return result.GetEventsResult;
            }
        } catch (ex) {
            this.logError();
        }
        return false;
    }
}

module.exports = Skud;

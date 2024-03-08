const soap = require('soap');
const axios = require('axios');
const { create } = require('xmlbuilder2');

function createSkud(url, location, login, password) {
    const skud = {
        url: url,
        location: location,
        login: login,
        password: password,
        connectionId: null,
        soapClient: null,


        async addHeader(soapClient, login, password) {
            const timestamp = new Date().toISOString();
            const expires = new Date(Date.now() + (5 * 60 * 1000)).toISOString(); // 5 minutes from now
        
            const auth = `<NS1:Security xmlns:NS1="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
                            <NS2:Timestamp xmlns:NS2="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
                                <Created xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">${timestamp}</Created>
                                <Expires xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">${expires}</Expires>
                            </NS2:Timestamp>
                            <NS1:UsernameToken>
                                <Username xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">${login}</Username>
                                <Password xmlns="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">${password}</Password>
                            </NS1:UsernameToken>
                        </NS1:Security>`;
        
            const authvalues = new soap.SOAPElement('Security', null, null, auth);
            const header = new soap.Header('http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd', 'Security', authvalues);
        
            soapClient.addSoapHeader(header);
        },

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
        },

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
        },

        async disconnect() {
            try {
                const result = await this.getSoap().DisconnectAsync();
                return result !== null;
            } catch (error) {
                console.error(error);
                return false;
            }
        },

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
        },

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
    };

    return skud;
}

module.exports = createSkud;

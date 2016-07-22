/* global angular */

angular.module('apclient-config', [])

        .constant('CONFIG',
                {
                    //URL WILL BE OVERIDED BY SETTING ON LOGIN
                    SERVER: 'http://103.5.50.109:8000/',
                    PATH_IMG: 'ws/img/',
                    
                    API_SOAP: 'api/services/ModelADService',
                    API_PHP: 'ws/',
                    //CONSTANT
                    
                    
                    //ENUM
                    
                    
                    //GENERAL
                    APP_ID: 'com.lumut.apclient',
                    APP_NAME: 'POZA',
                    APP_VERSION: '1.0.0.RC-4',
                }
        );

'use strict';

angular.module('ddsApp').service('MappingService', function($q, $http, droitsDescription, MappingPeriodService) {
    function generateRequestedVariables() {
        var structuredPrestations = _.values(droitsDescription).map(function(level) {
            return _.values(level).map(function(provider) {
                return _.values(_.mapValues(provider.prestations, function(prestation, prestationName) {
                    return prestation.uncomputability ? [ prestationName, prestationName + '_non_calculable'] : [ prestationName ];
                }));
            });
        });

        return _.chain(structuredPrestations).flatten().flatten().flatten().value();
    }

    function buildOpenFiscaRequest(situation) {
        return $q(function(resolve, reject) {
            return $http.get('/api/situations/' + situation._id + '/openfisca-request').then(function(simulation) {
                var request = {
                    intermediate_variables: true,
                    labels: true,
                    scenarios: [{
                        test_case: simulation.data.scenarios[0].test_case,
                        period: 'month:' + MappingPeriodService.toOpenFiscaFormat(situation.dateDeValeur),
                    }],
                    variables: generateRequestedVariables(),
                };

                resolve(request);
            }, reject);
        });
    }

    return {
        buildOpenFiscaRequest: buildOpenFiscaRequest,
    };
});
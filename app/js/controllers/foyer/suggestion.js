'use strict';

angular.module('ddsApp').controller('SuggestionCtrl', function($scope, droitsDescription, SituationService, ResultatService) {
    $scope.test = { expectedResults: [] };
    $scope.situationYAML = SituationService.YAMLRepresentation($scope.situation);

    $scope.submitting = false;
    $scope.submitLabel = function() {
        return $scope.submitting ? 'Enregistrement…' : 'Enregistrer';
    };

    var droits = [];
    for (var level in droitsDescription) {
        for (var provider in droitsDescription[level]) {
            for (var prestation in droitsDescription[level][provider].prestations) {
                droits.push(_.assign({
                    code: prestation,
                    level: level,
                    provider: provider,
                }, droitsDescription[level][provider].prestations[prestation]));
            }
        }
    }
    var droitsById = _.keyBy(droits, 'code');

    $scope.possibleValues = _.sortBy(droits, 'label');

    function displayValueFor(droit, value) {
        if (_.isBoolean(value)) {
            return value ? 'Oui' : 'Non';
        }

        if (_.isNumber(value)) {
            return value + ' ' + ( droit.unit || '€' );
        }

        if (_.isString(value)) {
            return droit.uncomputability && droit.uncomputability[value] && droit.uncomputability[value].reason.admin || 'raison non définie';
        }

        return value;
    }
    $scope.displayValueFor = displayValueFor;

    function generateState(test) {
        return JSON.stringify({
            name: test.name,
            description: test.description,
            scenario: SituationService.restoreLocal(),
            expectedResults: test.expectedResults.map(function(result) {
                return  {
                    code: result.ref.code,
                    expectedValue: result.expectedValue
                };
            })
        }, null, 2);
    }

    function getActualValue(droitId) {
        var droit = droitsById[droitId];
        console.log(droitId, $scope.droits);
        var providerData = $scope.droits[droit.level];
        if (droit.level == 'prestationsNationales')
            return providerData[droitId];

        return providerData[droit.provider] && providerData[droit.provider].prestations[droitId];
    }

    $scope.droitSelected = function(expectedResult) {
        if (! expectedResult)
            return;
        var actualValue = getActualValue(expectedResult.ref.code) || {};
        expectedResult.result = actualValue.montant;
        expectedResult.expectedValue = expectedResult.result;
        delete expectedResult.shouldCompute;
    };
});

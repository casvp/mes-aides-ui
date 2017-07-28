var mapping = require('./mapping');
var _ = require('lodash');

function createOpenFiscaTestSituation(situation) {
    var openfiscaRequest = mapping.buildOpenFiscaRequest(situation);
    var testCase = openfiscaRequest.scenarios[0].test_case;
    var entities = {
        period: openfiscaRequest.scenarios[0].period,
        familles: testCase.familles,
        foyers_fiscaux: testCase.foyers_fiscaux,
        individus: testCase.individus,
        menages: testCase.menages,
    };

    return entities;
}

function toStringOf(obj) {
    return obj.toString();
}

var ID_PROPERTIES = {
    familles: ['enfants', 'parents'],
    foyers_fiscaux: ['declarants', 'personnes_a_charge'],
    individus: ['id'],
    menages: ['conjoint', 'enfants', 'personne_de_reference'],
};

function normalizeIDs(test) {
    Object.keys(ID_PROPERTIES).forEach(function(entity) {
        if (test[entity]) {
            test[entity].forEach(function(value, index) {
                ID_PROPERTIES[entity].forEach(function(property) {
                    if (test[entity][index][property] instanceof Array)
                        test[entity][index][property] = test[entity][index][property].map(toStringOf);
                    else if (test[entity][index][property])
                        test[entity][index][property] = test[entity][index][property].toString();
                });
            });
        }
    });
}

function toYAML(test) {
    normalizeIDs(test);
    return require('js-yaml').safeDump(test);
}

var TEST_ATTRIBUTES = [
    'name',
    'description',
    'output_variables',
    'absolute_error_margin',
];

exports.generateYAMLTest = function generateYAMLTest(details, situation) {
    var test = _.assign(_.pick(details, TEST_ATTRIBUTES), createOpenFiscaTestSituation(situation.toObject ? situation.toObject() : situation));
    return toYAML(test);
};

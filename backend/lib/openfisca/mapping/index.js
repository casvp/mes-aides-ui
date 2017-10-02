var _ = require('lodash');

var common = require('./common');
var buildOpenFiscaIndividu = require('./individu');

var propertyMove = require('./propertyMove');
var last3MonthsDuplication = require('./last3MonthsDuplication');

function allocateIndividualsToEntities(situation) {
    var famille = situation.famille;
    var foyer = situation.foyer_fiscal;
    var menage = situation.menage;

    var demandeur = common.getDemandeur(situation);
    var demandeurId = demandeur && demandeur.id;
    if (demandeurId) {
        famille.parents = [ demandeurId ];
        foyer.declarants = [ demandeurId ];
        menage.personne_de_reference = [ demandeurId ];
    }

    var conjoint = common.getConjoint(situation);
    var conjointId = conjoint && conjoint.id;
    if (conjointId) {
        famille.parents.push(conjointId);
        foyer.declarants.push(conjointId);
        menage.conjoint = conjointId;
    }

    var enfants = common.getEnfants(situation);
    var validEnfants = _.filter(enfants, function(enfant) { return common.isIndividuValid(enfant, situation); });
    var enfantIds = validEnfants.map(function(enfant) { return enfant.id; });
    famille.enfants = enfantIds;
    foyer.personnes_a_charge = enfantIds;
    menage.enfants = enfantIds;
}

function setNonInjectedPrestationsToZero(familles, individus, dateDeValeur) {
    var subjects = {
        famille: familles,
        individu: individus,
    };
    var periods = common.getPeriods(dateDeValeur);
    var thisMonth = periods.thisMonth;
    var last12Months = periods.last12Months;

    var prestationsFinancieres = _.pickBy(common.requestedVariables, function(definition) {
        return (! definition.type) || definition.type === 'float';
    });

    _.forEach(prestationsFinancieres, function(definition, prestationName) {
        _.forEach(subjects[definition.entity || 'famille'], function(entity) {
            entity[prestationName] = entity[prestationName] || {};
            _.forEach(last12Months, function(period) {
                entity[prestationName][period] = entity[prestationName][period] || 0;
            });
        });
    });

    _.forEach(common.requestedVariables, function(definition, prestationName) {
        _.forEach(subjects[definition.entity || 'famille'], function(entity) {
            entity[prestationName] = entity[prestationName] || {};
            entity[prestationName][thisMonth] = entity[prestationName][thisMonth] || null;
        });
    });
}


function mapIndividus(situation) {
    var individus = _.filter(situation.individus, function(individu) {
        return common.isIndividuValid(individu, situation);
    });

    return _.map(individus, function(individu) {
        return buildOpenFiscaIndividu(individu, situation);
    }).reduce(function(accum, individu) {
        accum[individu.id] = individu;
        delete individu.id;
        return accum;
    }, {});
}

exports.buildOpenFiscaRequest = function(sourceSituation) {
    var situation = sourceSituation.toObject ? sourceSituation.toObject() : _.cloneDeep(sourceSituation);

    var individus = mapIndividus(situation);
    allocateIndividualsToEntities(situation);

    delete situation.menage.nom_commune;
    delete situation.menage.code_postal;

    var testCase = {
        individus: individus,
        familles: {
            _: situation.famille
        },
        foyers_fiscaux: {
            _: situation.foyer_fiscal
        },
        menages: {
            _: situation.menage
        },
    };

    propertyMove.movePropertyValuesToGroupEntity(testCase);
    setNonInjectedPrestationsToZero(testCase.familles, individus, situation.dateDeValeur);

    last3MonthsDuplication(testCase, situation.dateDeValeur);


    _.forEach(testCase.individus, function(individu) {
        delete individu.gir;
        delete individu.perte_autonomie;
        delete individu.rennes_metropole_transport;
    });

    delete testCase.familles._.adpa;
    delete testCase.familles._.loiret_apa;
    delete testCase.familles._.parisien;
    delete testCase.familles._.paris_complement_sante;
    delete testCase.familles._.paris_energie_famille;
    delete testCase.familles._.paris_forfait_famille;
    delete testCase.familles._.paris_logement;
    delete testCase.familles._.paris_logement_aspeh;
    delete testCase.familles._.paris_logement_familles;
    delete testCase.familles._.paris_logement_plfm;
    delete testCase.familles._.paris_logement_psol;

    return testCase;
};

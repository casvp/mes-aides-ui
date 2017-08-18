var moment = require('moment');
var _ = require('lodash');
var individuRessource = require('./ressources');
var proxyAnneeDeReferenceRessources = require('./proxyAnneeDeReferenceRessources');

function formatDate(date) {
    return moment(date).format('YYYY-MM-DD');
}

var individuSchema = {
    date_naissance: {
        src: 'date_naissance',
        fn: formatDate
    },
    age: {
        src: 'date_naissance',
        fn: function (dateDeNaissance, individu, situation) {
            return moment(situation.dateDeValeur).diff(moment(dateDeNaissance), 'years');
        }
    },
    age_en_mois: {
        src: 'date_naissance',
        fn: function (dateDeNaissance, individu, situation) {
            return moment(situation.dateDeValeur).diff(moment(dateDeNaissance), 'months');
        }
    },
    date_arret_de_travail: {
        src: 'date_arret_de_travail',
        fn: formatDate
    },
    activite: {
        src: 'specificSituations',
        fn: function(specificSituations) {
            var returnValue;
            _.forEach({
                demandeur_emploi: 1,
                etudiant: 2,
                retraite: 3
            }, function(situationIndex, situationId) {
                if (specificSituations.indexOf(situationId) >= 0) {
                    returnValue = situationIndex;
                }
            });
            return returnValue;
        }
    },
    handicap: {
        src: 'specificSituations',
        fn: function(specificSituations) {
            return specificSituations.indexOf('handicap') >= 0;
        }
    },
    taux_incapacite: {
        fn: function(individu) {
            var handicap = individu.specificSituations.indexOf('handicap') >= 0;
            var tauxMap = {
                    moins50: 0.3,
                    moins80: 0.7,
                    plus80: 0.9
            };
            return handicap && tauxMap[individu.tauxIncapacite];
        }
    },
    inapte_travail: {
        src: 'specificSituations',
        fn: function(specificSituations) {
            return specificSituations.indexOf('inapte_travail') >= 0;
        }
    },
    etudiant: {
        src: 'specificSituations',
        fn: function(specificSituations) {
            return specificSituations.indexOf('etudiant') >= 0;
        }
    },
};

function isNotValidValue(value) {
    return _.isNaN(value) || _.isUndefined(value) || value === null;
}

function buildOpenFiscaIndividu(mesAidesIndividu, situation) {
    var openFiscaIndividu = _.cloneDeep(mesAidesIndividu);
    _.forEach(individuSchema, function(definition, openfiscaKey) {
        var params = _.isString(definition) ? { src: definition } : definition;

        openFiscaIndividu[openfiscaKey] = params.src ? params.fn(mesAidesIndividu[params.src], mesAidesIndividu, situation) : params.fn(mesAidesIndividu, situation);

        // Remove null as OpenFisca do not handle them correctly
        if (isNotValidValue(openFiscaIndividu[openfiscaKey])) {
            delete openFiscaIndividu[openfiscaKey];
        }
    });

    individuRessource.computeRessources(mesAidesIndividu, openFiscaIndividu);
    proxyAnneeDeReferenceRessources(openFiscaIndividu, situation);

    var propertiesToDelete = [
        'firstName',
        'nationalite',
        'role',
        'salaire_net_hors_revenus_exceptionnels',
        'specificSituations',
        'tauxIncapacite',
    ];

    propertiesToDelete.forEach(function(propertyName) {
        delete openFiscaIndividu[propertyName];
    });

    return openFiscaIndividu;
}

module.exports = buildOpenFiscaIndividu;
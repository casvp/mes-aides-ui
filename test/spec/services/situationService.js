'use strict';

describe('Service: situationService', function () {

    var service;

    beforeEach(function() {
        module('ddsApp');
        inject(function(SituationService) {
            service = SituationService;
        });
    });

    describe('function hasEnfantScolarise()', function() {
        it('should return a truthy only when situation has a child with scolarite "college" or "lycee"', function() {
            // given
            var situations = [
                { individus: [{ role: 'enfant', scolarite: 'Collège' }] },
                { individus: [{ role: 'enfant', scolarite: 'Lycée' }] },
                { individus: [] }
            ];

            // when
            var results = _.map(situations, function(situation) {
                return service.hasEnfantScolarise(situation);
            });

            // then
            expect(results[0]).toBeTruthy();
            expect(results[1]).toBeTruthy();
            expect(results[2]).toBeFalsy();
        });
    });

    describe('function hasEnfant()', function() {
        it('should return a truthy when there is a child', function() {
            // given
            var situations = [
                { individus: [{ role: 'enfant'}] },
            ];

            // when
            var results = _.map(situations, function(situation) {
                return service.hasEnfant(situation);
            });

            // then
            expect(results[0]).toBeTruthy();
        });
    });
    describe('function hasEnfant()', function() {
        it('should return a falsy when there is no child', function() {
            // given
            var situations = [
                { individus: [{ role: 'demandeur' }]},
            ];

            // when
            var results = _.map(situations, function(situation) {
                return service.hasEnfant(situation);
            });

            // then
            expect(results[0]).toBeFalsy();
        });
    });
    describe('function setConjoint()', function() {
        it('should add the conjoint at the end of the individus array', function() {
            // given
            var situation = {
                individus:
                    [
                        { role: 'demandeur' },
                        { role: 'enfant' }
                    ]
            };
            var conjoint = { role : 'conjoint' };

            // when
            service.setConjoint(situation, conjoint);
            // then
            expect(situation.individus[2].role).toBe('conjoint');
        });
        it('should replace the conjoint if it already exists', function() {
            // given
            var situation = {
                individus:
                    [
                        { role: 'demandeur' },
                        { role: 'enfant' },
                        { role: 'conjoint', name: 'Alice' }
                    ]
            };
            var conjoint = { role : 'conjoint', name: 'Bob' };

            // when
            service.setConjoint(situation, conjoint);
            // then
            expect(situation.individus[2].name).toBe('Bob');
        });
    });
    describe('function setEnfants()', function() {
        it('should add the enfants before the conjoint in the individus array', function() {
            // given
            var situation = {
                individus:
                    [
                        { role: 'demandeur' },
                        { role: 'enfant' },
                        { role: 'conjoint' }
                    ]
            };
            var enfants = [{ role : 'enfant' }, { role: 'enfant' }];

            // when
            service.setEnfants(situation, enfants);
            // then
            expect(situation.individus[2].role).toBe('enfant');
            expect(situation.individus[3].role).toBe('conjoint');
        });
        it('should replace the enfants if they already exist', function() {
            // given
            var situation = {
                individus:
                    [
                        { role: 'demandeur' },
                        { role: 'enfant', name:'Alice' },
                        { role: 'conjoint' }
                    ]
            };
            var enfants = [{ role : 'enfant', name:'Bob' }];

            // when
            service.setEnfants(situation, enfants);
            // then
            expect(situation.individus.length).toBe(3);
            expect(situation.individus[1].name).toBe('Bob');
        });
    });

    describe('function ressourcesYearMoins2Captured()', function() {
        it('should detect N-2 ressources', function() {
            // given
            var situation = {
                individus: [{
                    retraite_imposable: {
                        '2015': 1000,
                    },
                }],
                foyer_fiscal: {},
                dateDeValeur: '2017-02-23',
            };

            // when
            var ressources_captured = service.ressourcesYearMoins2Captured(situation);
            // then
            expect(ressources_captured).toBeTruthy();
        });

        it('should detect N-2 ressources', function() {
            // given
            var situation = {
                individus: [{
                    retraite_imposable: {},
                }],
                foyer_fiscal: {},
                dateDeValeur: '2017-02-23',
            };

            // when
            var ressources_captured = service.ressourcesYearMoins2Captured(situation);
            // then
            expect(ressources_captured).toBeFalsy();
        });

        it('should detect rfr', function() {
            // given
            var situation = {
                dateDeValeur: '2017-01-01',
                individus:
                    [
                        { ressources: []},
                    ],
                foyer_fiscal: {
                    rfr: {
                        '2015': 20000
                    },
                },
            };

            // when
            var ressources_captured = service.ressourcesYearMoins2Captured(situation);
            // then
            expect(ressources_captured).toBeTruthy();
        });
    });

    describe('cleanSituation', function() {

        function createSituationWithInitialValue(initialValue) {
            var demandeur = {
                role: 'demandeur',
                frais_reels: {
                    '2014': initialValue,
                },
            };
            var conjoint = { role: 'conjoint' };
            var enfant = { role: 'enfant' };
            return {
                dateDeValeur: '2016-08-23',
                individus: [demandeur, conjoint, enfant],
            };
        }


        it('should round ym2 ressources', function() {
            var situation = createSituationWithInitialValue(42.24);
            service._cleanSituation(situation);
            var demandeur = situation.individus[0];

            expect(demandeur.frais_reels['2014']).toBe(42);
        });

        describe('null removal', function() {
            it('should drop nulls in Y-2 ressources', function() {
                var situation = createSituationWithInitialValue(null);
                var demandeur = situation.individus[0];

                service._cleanSituation(situation);
                expect('2014' in demandeur.frais_reels).toBe(false);
            });

            it('should keep zeros in Y-2 ressources', function() {
                var situation = createSituationWithInitialValue(0);
                var demandeur = situation.individus[0];

                service._cleanSituation(situation);
                expect(demandeur.frais_reels['2014']).toBe(0);
            });
        });
    });
});

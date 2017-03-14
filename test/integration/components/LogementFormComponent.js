title: 'h1',

declareSDSRadio: '[value="sansDomicile"] ~ span',
declareLocataireRadio: '[value="locataire"] ~ span',

declareLogementIsNotColocationRadio: '[model$="colocation"] [ng-class*="false"]',
declareProprietaireNotInFamilyRadio: '[model$="membreFamilleProprietaire"] [ng-class*="false"]',
declareLogementIsNotMeubleRadio: '[value="nonmeuble"]',
declareLogementIsNotChambreRadio: '[model$="isChambre"] [ng-class*="false"]',
loyerInput: '#loyer',
chargesInput: '#charges',

zipCodeInput: '#postal-code',
errorMessage: '.has-error .help-block',
commune: '#commune [selected]',
submitButton: 'button[type="submit"]',

const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const isValidVehicleStr = `
    function isValidVehicle(data) {
      return data.keys().hasAll(['marca', 'modelo', 'preco', 'createdAt', 'ownerId']) &&
             data.marca is string && data.marca.size() > 0 &&
             data.modelo is string && data.modelo.size() > 0 &&
             data.preco is number &&
             data.createdAt is number &&
             data.ownerId is string &&
             (!('versao' in data) || data.versao is string) &&
             (!('anoFabricacao' in data) || data.anoFabricacao is number) &&
             (!('anoModelo' in data) || data.anoModelo is number) &&
             (!('km' in data) || data.km is number) &&
             (!('cambio' in data) || data.cambio is string) &&
             (!('combustivel' in data) || data.combustivel is string) &&
             (!('carroceria' in data) || data.carroceria is string) &&
             (!('cor' in data) || data.cor is string) &&
             (!('cidade' in data) || data.cidade is string) &&
             (!('estado' in data) || data.estado is string) &&
             (!('anuncianteType' in data) || data.anuncianteType is string) &&
             (!('fotos' in data) || (data.fotos is list && data.fotos.size() <= 20)) &&
             (!('opcionais' in data) || (data.opcionais is list && data.opcionais.size() <= 50)) &&
             (!('descricao' in data) || data.descricao is string) &&
             (!('vendedor' in data) || data.vendedor is map) &&
             (!('destaque' in data) || data.destaque is bool);
    }
`;

const matchVehicleStr = `
    match /vehicles/{vehicleId} {
      allow read: if true;
      allow create: if isSignedIn() &&
                       isValidId(vehicleId) &&
                       isValidVehicle(incoming()) &&
                       incoming().ownerId == request.auth.uid;
      allow update: if (isSignedIn() && existing().ownerId == request.auth.uid) &&
                       isValidVehicle(incoming()) &&
                       incoming().ownerId == existing().ownerId &&
                       (!('createdAt' in incoming()) || incoming().createdAt == existing().createdAt);
      allow delete: if isSignedIn() && existing().ownerId == request.auth.uid;
    }
`;

rules = rules.replace('// Entity Validation Helpers', '// Entity Validation Helpers' + isValidVehicleStr);
rules = rules.replace('match /users/{userId} {', matchVehicleStr + '\n    match /users/{userId} {');

fs.writeFileSync('firestore.rules', rules);

const fs = require('fs');

const blueprint = JSON.parse(fs.readFileSync('firebase-blueprint.json', 'utf8'));

blueprint.entities.Vehicle = {
  "title": "Vehicle",
  "description": "A vehicle listing in the marketplace.",
  "type": "object",
  "properties": {
    "marca": { "type": "string" },
    "modelo": { "type": "string" },
    "versao": { "type": "string" },
    "anoFabricacao": { "type": "number" },
    "anoModelo": { "type": "number" },
    "preco": { "type": "number" },
    "km": { "type": "number" },
    "cambio": { "type": "string" },
    "combustivel": { "type": "string" },
    "carroceria": { "type": "string" },
    "cor": { "type": "string" },
    "cidade": { "type": "string" },
    "estado": { "type": "string" },
    "anuncianteType": { "type": "string" },
    "fotos": { "type": "array" },
    "destaque": { "type": "boolean" },
    "opcionais": { "type": "array" },
    "descricao": { "type": "string" },
    "vendedor": { "type": "object" },
    "createdAt": { "type": "number" },
    "ownerId": { "type": "string" }
  },
  "required": [
    "marca", "modelo", "preco", "createdAt", "ownerId"
  ]
};

blueprint.firestore['vehicles/{vehicleId}'] = {
  "schema": "Vehicle",
  "description": "Marketplace vehicle listings. Readable by anyone, writable by owners."
};

fs.writeFileSync('firebase-blueprint.json', JSON.stringify(blueprint, null, 2));

console.log('Updated firebase-blueprint.json');

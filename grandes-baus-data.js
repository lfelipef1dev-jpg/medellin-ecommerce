/**
 * Grandes Baús – mesmo padrão da Santa: CAMINHÕES = todos, VEÍCULOS = alguns.
 * Usa VEICULOS_POR_CATEGORIA (veiculos-data.js) quando existir; senão usa FALLBACK_CATALOG
 * para que caminhões e veículos SEMPRE apareçam na página.
 */
(function () {
    /** Catálogo de fallback: nome e preço por model (igual api/grandes-baus-products.js). Garante que a página nunca fique vazia. */
    var FALLBACK_CATALOG = {
        mule: { nome: 'Mule', preco: 93 }, mule2: { nome: 'Mule', preco: 93 }, mule3: { nome: 'Mule', preco: 93 }, mule4: { nome: 'Mule Custom', preco: 93 },
        pounder: { nome: 'Pounder', preco: 97 }, pounder2: { nome: 'Pounder Custom', preco: 97 },
        benson: { nome: 'Benson', preco: 97 }, phantom: { nome: 'Phantom', preco: 112 }, phantom2: { nome: 'Phantom Wedge', preco: 112 }, phantom3: { nome: 'Phantom Custom', preco: 115 },
        hauler: { nome: 'Hauler', preco: 112 }, hauler2: { nome: 'Hauler Custom', preco: 112 },
        stockade: { nome: 'Stockade', preco: 112 }, stockade3: { nome: 'Stockade 3', preco: 177 },
        tiptruck: { nome: 'Tipper', preco: 89 }, tiptruck2: { nome: 'Tipper II', preco: 89 },
        mixer: { nome: 'Mixer', preco: 89 }, mixer2: { nome: 'Mixer II', preco: 89 },
        dump: { nome: 'Dump Truck', preco: 89 }, flatbed: { nome: 'Flatbed Truck', preco: 89 }, flatbed2: { nome: 'Flatbed 2', preco: 89 }, flatbed3: { nome: 'Flatbed 3', preco: 89 },
        bulldozer: { nome: 'Dozer', preco: 89 }, towtruck: { nome: 'Tow Truck (Large)', preco: 89 }, towtruck2: { nome: 'Tow Truck (Small)', preco: 89 },
        tractor: { nome: 'Tractor', preco: 89 }, tractor2: { nome: 'Fieldmaster', preco: 89 },
        rubble: { nome: 'Rubble', preco: 89 }, biff: { nome: 'Biff', preco: 89 }, packer: { nome: 'Packer', preco: 89 },
        freight: { nome: 'Freight', preco: 89 }, freighttrailer: { nome: 'Freight Trailer', preco: 92 }, freightcont1: { nome: 'Freight Container 1', preco: 110 }, freightcont2: { nome: 'Freight Container 2', preco: 112 }, freightgrain: { nome: 'Freight Grain', preco: 102 }, freightcar: { nome: 'Freight Car', preco: 105 },
        utillitruck: { nome: 'Utility Truck (Cherry Picker)', preco: 89 }, utillitruck2: { nome: 'Utility Truck (Van)', preco: 89 }, utillitruck3: { nome: 'Utility Truck (Contender)', preco: 89 },
        handler: { nome: 'Handler', preco: 89 }, docktug: { nome: 'Docktug', preco: 89 }, ripley: { nome: 'Ripley', preco: 89 }, airtug: { nome: 'Airtug', preco: 89 }, mower: { nome: 'Lawn Mower', preco: 89 }, forklift: { nome: 'Forklift', preco: 89 },
        trash: { nome: 'Trash', preco: 89 }, trash2: { nome: 'Trash 2', preco: 89 },
        speedo: { nome: 'Speedo', preco: 83 }, speedo2: { nome: 'Speedo 2', preco: 94 }, speedo4: { nome: 'Speedo Custom', preco: 84 },
        burrito: { nome: 'Burrito', preco: 88 }, burrito2: { nome: 'Burrito 2', preco: 88 }, burrito3: { nome: 'Burrito', preco: 81 }, burrito4: { nome: 'Burrito 4', preco: 89 }, burrito5: { nome: 'Burrito 5', preco: 89 },
        youga: { nome: 'Youga', preco: 82 }, youga2: { nome: 'Youga Classic', preco: 84 },
        rumpo: { nome: 'Rumpo', preco: 82 }, rumpo2: { nome: 'Rumpo 2', preco: 93 },
        boxville: { nome: 'Boxville LSDWP', preco: 94 }, boxville2: { nome: 'Boxville Go Postal', preco: 94 }, boxville3: { nome: 'Boxville Humane Labs', preco: 94 }, boxville4: { nome: 'Boxville Post OP', preco: 94 }, boxville5: { nome: 'Armored Boxville', preco: 94 },
        bison: { nome: 'Bison', preco: 85 }, bison2: { nome: 'Bison 2', preco: 89 }, bison3: { nome: 'Bison 3', preco: 89 },
        guardian: { nome: 'Guardian', preco: 89 }, pony: { nome: 'Pony', preco: 94 }, pony2: { nome: 'Pony (Smoke on the water)', preco: 94 },
        journey: { nome: 'Journey', preco: 82 }, moonbeam: { nome: 'Moonbeam', preco: 84 }, moonbeam2: { nome: 'Moonbeam Custom', preco: 84 },
        gburrito: { nome: 'Gang Burrito', preco: 89 }, gburrito2: { nome: 'Burrito Custom', preco: 83 },
        sadler: { nome: 'Sadler', preco: 85 }, sadler2: { nome: 'Sadler 2', preco: 88 },
        minivan: { nome: 'Minivan', preco: 89 }, minivan2: { nome: 'Minivan 2', preco: 89 }, surfer: { nome: 'Surfer', preco: 82 }, surfer2: { nome: 'Surfer 2', preco: 89 },
        granger: { nome: 'Granger', preco: 89 }, patriot: { nome: 'Patriot', preco: 89 }, patriot2: { nome: 'Patriot Stretch', preco: 89 },
        landstalker: { nome: 'Landstalker', preco: 85 }, landstalker2: { nome: 'Landstalker XL', preco: 91 },
        baller: { nome: 'Baller', preco: 89 }, baller2: { nome: 'Baller II', preco: 86 }, baller3: { nome: 'Baller LE', preco: 86 }, baller4: { nome: 'Baller LE LWB', preco: 93 },
        dubsta: { nome: 'Dubsta', preco: 88 }, dubsta2: { nome: 'Dubsta Luxury', preco: 88 }, dubsta3: { nome: 'Dubsta 6x6', preco: 92 },
        cavalcade: { nome: 'Cavalcade', preco: 86 }, cavalcade2: { nome: 'Cavalcade II', preco: 87 },
        huntley: { nome: 'Huntley S', preco: 91 }, rocoto: { nome: 'Rocoto', preco: 85 }, fq2: { nome: 'FQ2', preco: 88 }, bjxl: { nome: 'BeeJay XL', preco: 88 },
        rebel: { nome: 'Rebel', preco: 93 }, rebel2: { nome: 'Rebel', preco: 85 }, rancherxl: { nome: 'Rancher XL', preco: 86 }, rancherxl2: { nome: 'Rancher XL 2', preco: 93 },
        kamacho: { nome: 'Kamacho', preco: 92 }, freecrawler: { nome: 'Freecrawler', preco: 89 }, everon: { nome: 'Everon', preco: 95 }, hellion: { nome: 'Hellion', preco: 94 },
        bobcatxl: { nome: 'Bobcat XL Open', preco: 84 }, ratloader: { nome: 'Ratloader', preco: 88 }, ratloader2: { nome: 'Ratloader 2', preco: 89 },
        bodhi2: { nome: 'Bodhi 2', preco: 95 }, dloader: { nome: 'D Loader', preco: 95 }, mesa: { nome: 'Mesa', preco: 84 }
    };

    var mapByModel = {};
    var POR_CATEGORIA = window.VEICULOS_POR_CATEGORIA;
    if (POR_CATEGORIA && typeof POR_CATEGORIA === 'object') {
        Object.keys(POR_CATEGORIA).forEach(function (cat) {
            var list = POR_CATEGORIA[cat];
            if (!Array.isArray(list)) return;
            list.forEach(function (v) {
                if (v && v.model) mapByModel[v.model] = v;
            });
        });
    }
    /* Preencher faltantes com fallback (imagem vem de assets/vehicles por padrão) */
    Object.keys(FALLBACK_CATALOG).forEach(function (model) {
        if (!mapByModel[model]) {
            var f = FALLBACK_CATALOG[model];
            mapByModel[model] = { model: model, nome: f.nome, preco: f.preco, imageFolder: 'vehicles' };
        }
    });

    /** Caminhões: TODOS os que existem na loja (commercial/industrial – Mule, Pounder, Benson, Phantom, Hauler, Stockade, Tipper, Mixer, Dump, Flatbed, etc.) */
    var CAMINHOES_MODELS = [
        'mule', 'mule2', 'mule3', 'mule4', 'pounder', 'pounder2', 'benson', 'phantom', 'phantom2', 'phantom3',
        'hauler', 'hauler2', 'stockade', 'stockade3', 'tiptruck', 'tiptruck2', 'mixer', 'mixer2', 'dump', 'flatbed', 'flatbed2',
        'bulldozer', 'towtruck', 'towtruck2', 'tractor', 'tractor2', 'rubble', 'biff', 'packer',
        'freight', 'freighttrailer', 'freightcont1', 'freightcont2', 'freightgrain', 'freightcar',
        'utillitruck', 'utillitruck2', 'utillitruck3', 'handler', 'docktug', 'ripley', 'airtug', 'mower', 'forklift',
        'flatbed3', 'trash', 'trash2'
    ];

    /** Veículos (grande baú): ALGUNS – vans, SUVs, pickups (lista fixa como na Santa) */
    var VEICULOS_GRANDE_BAU_MODELS = [
        'speedo', 'speedo2', 'speedo4', 'burrito', 'burrito2', 'burrito3', 'burrito4', 'burrito5',
        'youga', 'youga2', 'rumpo', 'rumpo2', 'boxville', 'boxville2', 'boxville3', 'boxville4', 'boxville5',
        'bison', 'bison2', 'bison3', 'guardian', 'pony', 'pony2', 'journey', 'moonbeam', 'moonbeam2',
        'gburrito', 'gburrito2', 'sadler', 'sadler2', 'minivan', 'minivan2', 'surfer', 'surfer2',
        'granger', 'patriot', 'patriot2', 'landstalker', 'landstalker2', 'baller', 'baller2', 'baller3', 'baller4',
        'dubsta', 'dubsta2', 'dubsta3', 'cavalcade', 'cavalcade2', 'huntley', 'rocoto', 'fq2', 'bjxl',
        'rebel', 'rebel2', 'rancherxl', 'rancherxl2', 'kamacho', 'freecrawler', 'everon', 'hellion',
        'bobcatxl', 'ratloader', 'ratloader2', 'bodhi2', 'dloader', 'mesa'
    ];

    function buildList(modelList) {
        var out = [];
        var seen = {};
        modelList.forEach(function (model) {
            if (seen[model]) return;
            var v = mapByModel[model];
            if (v) {
                seen[model] = true;
                out.push({
                    model: v.model,
                    nome: v.nome || v.model,
                    preco: typeof v.preco === 'number' ? v.preco : parseFloat(v.preco) || 0,
                    imageFolder: v.imageFolder || 'vehicles',
                    imageModel: v.imageModel,
                    imageExt: v.imageExt
                });
            }
        });
        return out;
    }

    window.GRANDES_BAUS_CAMINHOES = buildList(CAMINHOES_MODELS);
    window.GRANDES_BAUS_VEICULOS = buildList(VEICULOS_GRANDE_BAU_MODELS);
})();

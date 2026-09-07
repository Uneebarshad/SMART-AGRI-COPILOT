"""Seed the diseases table with the initial disease library dataset.

This module is called once during init_db() when the diseases table is empty.
The dataset matches the frontend's existing diseasesMock.js so the transition
to backend-driven data is seamless.
"""

from __future__ import annotations

import json
import logging

from sqlalchemy.orm import Session

from app.models.disease import Disease

logger = logging.getLogger("smart_agri_copilot.disease_seed")

# The initial disease library dataset — mirrors the frontend mock data.
DISEASE_SEED_DATA = [
    {
        "slug": "tomato-early-blight",
        "name": "Early blight",
        "crop": "Tomato",
        "disease_type": "Fungal",
        "severity": "Medium",
        "description": "A common leaf and fruit disease that starts on older tomato leaves and can reduce plant vigour.",
        "symptoms": ["Small dark spots with concentric rings", "Yellowing around older leaf spots", "Dark lesions near the stem end of fruit"],
        "causes": ["Fungal spores spread by splashing water", "Warm, humid weather and wet leaves", "Plant debris left near the crop"],
        "prevention": ["Water at soil level and keep leaves dry", "Give plants room for airflow", "Remove affected debris after harvest"],
        "recommended_actions": ["Remove badly affected lower leaves", "Add clean mulch to reduce soil splash", "Use a locally approved fungicide only as its label directs"],
        "commonness": 10,
    },
    {
        "slug": "potato-late-blight",
        "name": "Late blight",
        "crop": "Potato",
        "disease_type": "Fungal",
        "severity": "High",
        "description": "A fast-spreading disease that can affect potato leaves, stems, and tubers during cool, wet periods.",
        "symptoms": ["Water-soaked dark patches on leaves", "White growth around lesions in humid conditions", "Firm brown or purple areas on tubers"],
        "causes": ["Wind- and rain-dispersed spores", "Cool, wet weather with long leaf wetness", "Infected seed potatoes or volunteer plants"],
        "prevention": ["Start with healthy certified seed", "Avoid overhead irrigation", "Inspect plants frequently after wet weather"],
        "recommended_actions": ["Isolate and remove heavily affected foliage", "Do not save tubers from visibly affected plants", "Ask a local crop adviser about timely protection options"],
        "commonness": 9,
    },
    {
        "slug": "wheat-leaf-rust",
        "name": "Leaf rust",
        "crop": "Wheat",
        "disease_type": "Fungal",
        "severity": "Medium",
        "description": "A rust disease that produces orange-brown pustules and may reduce grain filling when infection is severe.",
        "symptoms": ["Orange-brown powdery spots on leaves", "Pustules that rub off on clothing or fingers", "Earlier leaf drying in heavily affected areas"],
        "causes": ["Rust spores carried by wind", "Susceptible varieties", "Mild temperatures and extended leaf moisture"],
        "prevention": ["Choose locally recommended resistant varieties", "Keep volunteer wheat under control", "Scout from tillering through grain filling"],
        "recommended_actions": ["Mark patches and monitor spread across the field", "Record the growth stage and affected area", "Use a registered treatment only when local guidance recommends it"],
        "commonness": 8,
    },
    {
        "slug": "rice-bacterial-leaf-blight",
        "name": "Bacterial leaf blight",
        "crop": "Rice",
        "disease_type": "Bacterial",
        "severity": "High",
        "description": "A bacterial disease that can cause long drying lesions and serious yield loss in susceptible rice crops.",
        "symptoms": ["Water-soaked lines along leaf edges", "Yellow to straw-coloured leaf drying", "Milky drops or ooze on fresh lesions after rain"],
        "causes": ["Bacteria entering through wounds or natural openings", "Storms, flooding, and strong winds", "Excess nitrogen and dense crop growth"],
        "prevention": ["Use clean seed and balanced nutrition", "Keep field tools clean between areas", "Improve drainage where practical"],
        "recommended_actions": ["Flag affected sections for closer scouting", "Avoid moving water from affected areas into clean plots", "Contact a local extension adviser for field-specific management"],
        "commonness": 7,
    },
    {
        "slug": "cotton-bollworm",
        "name": "Cotton bollworm",
        "crop": "Cotton",
        "disease_type": "Pest-related",
        "severity": "High",
        "description": "Caterpillar feeding that can damage squares, flowers, and bolls, especially when larvae are protected inside them.",
        "symptoms": ["Small holes in squares or bolls", "Frass near feeding holes", "Wilting or shed fruiting parts"],
        "causes": ["Moth eggs laid on young plant growth", "Warm conditions supporting repeated generations", "Late detection of young larvae"],
        "prevention": ["Scout squares and flowers twice a week", "Encourage beneficial insects", "Remove volunteer host plants around the field"],
        "recommended_actions": ["Inspect damaged bolls and record live larvae", "Prioritize treatment decisions using local thresholds", "Follow product labels and rotate approved modes of action"],
        "commonness": 6,
    },
    {
        "slug": "maize-northern-leaf-blight",
        "name": "Northern leaf blight",
        "crop": "Maize",
        "disease_type": "Fungal",
        "severity": "Medium",
        "description": "A leaf disease that forms long grey-green lesions and can limit photosynthesis before grain maturity.",
        "symptoms": ["Long cigar-shaped grey-green lesions", "Lesions beginning on lower leaves", "Premature browning when disease is severe"],
        "causes": ["Fungal spores surviving in crop residue", "Warm, humid weather", "Continuous maize and susceptible hybrids"],
        "prevention": ["Rotate crops where possible", "Bury or manage infected residue responsibly", "Choose adapted, less susceptible hybrids"],
        "recommended_actions": ["Scout lower leaves before the canopy closes", "Map hotspots for future rotation planning", "Seek local advice before applying a fungicide"],
        "commonness": 5,
    },
    {
        "slug": "potato-mosaic-virus",
        "name": "Mosaic virus",
        "crop": "Potato",
        "disease_type": "Viral",
        "severity": "Medium",
        "description": "A group of viral infections that may cause mottled leaves and reduced plant growth in potato crops.",
        "symptoms": ["Light and dark green mottling", "Leaf crinkling or mild distortion", "Uneven plant size across a row"],
        "causes": ["Infected seed tubers", "Aphids and contact spread between plants", "Handling plants with contaminated tools"],
        "prevention": ["Plant certified virus-free seed", "Control volunteer potatoes and weeds", "Clean tools and hands between suspect areas"],
        "recommended_actions": ["Mark unusual plants and compare nearby rows", "Remove confirmed suspect plants carefully", "Do not use affected tubers as seed without expert advice"],
        "commonness": 4,
    },
    {
        "slug": "rice-brown-planthopper",
        "name": "Brown planthopper",
        "crop": "Rice",
        "disease_type": "Pest-related",
        "severity": "High",
        "description": "Sap-feeding insects that can cause yellowing and patchy crop collapse, known as hopperburn, when populations build up.",
        "symptoms": ["Small insects clustered near the base of stems", "Yellowing patches that expand outward", "Dry brown plants despite moist soil"],
        "causes": ["High insect populations in dense crop canopies", "Excess nitrogen", "Broad-spectrum sprays that reduce natural enemies"],
        "prevention": ["Use balanced fertilizer rates", "Maintain spacing and avoid standing water stress", "Protect spiders and other beneficial predators"],
        "recommended_actions": ["Tap stems over water to check for moving insects", "Mark and monitor yellowing patches", "Use locally approved control measures only when thresholds are met"],
        "commonness": 3,
    },
    {
        "slug": "cotton-bacterial-blight",
        "name": "Bacterial blight",
        "crop": "Cotton",
        "disease_type": "Bacterial",
        "severity": "Low",
        "description": "A bacterial disease that can make angular leaf spots and dark lesions on stems, bolls, or bracts.",
        "symptoms": ["Angular brown leaf spots", "Dark streaks along veins or petioles", "Small water-soaked spots on bolls"],
        "causes": ["Bacteria carried on seed or plant residue", "Rain splash and stormy weather", "Injured plant tissue"],
        "prevention": ["Use clean, treated seed from a trusted source", "Avoid working wet fields", "Rotate away from cotton where practical"],
        "recommended_actions": ["Remove heavily infected volunteer plants", "Improve field airflow and drainage", "Record recurring areas for next-season planning"],
        "commonness": 2,
    },
    {
        "slug": "tomato-aphids",
        "name": "Aphids",
        "crop": "Tomato",
        "disease_type": "Pest-related",
        "severity": "Low",
        "description": "Small sap-feeding insects that cluster on tender tomato growth and may spread viruses between plants.",
        "symptoms": ["Clusters of small soft-bodied insects", "Curled or sticky young leaves", "Sooty mould on honeydew-covered leaves"],
        "causes": ["Aphids moving from weeds or nearby crops", "Warm weather and lush new growth", "Reduced natural predator activity"],
        "prevention": ["Inspect new growth and leaf undersides", "Remove weeds that host aphids", "Encourage ladybirds and other beneficial insects"],
        "recommended_actions": ["Wash small colonies from leaves with a firm water spray", "Remove badly distorted shoot tips", "Use a selective, locally approved product only if needed"],
        "commonness": 1,
    },
]


def seed_diseases_if_empty(db: Session) -> None:
    """Insert the initial disease dataset if the diseases table is empty."""
    existing_count = db.query(Disease).count()
    if existing_count > 0:
        return

    logger.info("Seeding %d disease entries...", len(DISEASE_SEED_DATA))
    for entry in DISEASE_SEED_DATA:
        disease = Disease(
            slug=entry["slug"],
            name=entry["name"],
            crop=entry["crop"],
            disease_type=entry["disease_type"],
            severity=entry["severity"],
            description=entry["description"],
            symptoms=json.dumps(entry["symptoms"]),
            causes=json.dumps(entry["causes"]),
            prevention=json.dumps(entry["prevention"]),
            recommended_actions=json.dumps(entry["recommended_actions"]),
            commonness=entry["commonness"],
        )
        db.add(disease)

    db.commit()
    logger.info("Disease library seeded with %d entries.", len(DISEASE_SEED_DATA))

"""
Seed script: populate the merchants collection with Sri Lankan businesses.
Run once from the backend directory:
    python -m app.scripts.seed_merchants
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from app.database.db import connect_db, get_db, seed_merchant

MERCHANTS = [
    # ─── Shopping ───
    ("Keells", ["keells", "keels", "keells super", "keells supermarket", "keells food city"], "Shopping"),
    ("Cargills", ["cargills", "cargills food city", "food city"], "Shopping"),
    ("Arpico", ["arpico", "arpico super"], "Shopping"),
    ("Sathosa", ["sathosa", "lanka sathosa"], "Shopping"),
    ("Glomark", ["glomark"], "Shopping"),
    ("SPAR", ["spar"], "Shopping"),
    ("Laugfs Super", ["laugfs super", "laugfs supermarket", "laughs super"], "Shopping"),
    ("Softlogic Max", ["softlogic max", "softlogic"], "Shopping"),
    ("Singer", ["singer", "singer sri lanka"], "Shopping"),
    ("Damro", ["damro"], "Shopping"),
    ("Abans", ["abans"], "Shopping"),
    ("Odel", ["odel"], "Shopping"),
    ("Fashion Bug", ["fashion bug"], "Shopping"),
    ("Cool Planet", ["cool planet"], "Shopping"),
    ("Nolimit", ["nolimit"], "Shopping"),
    ("House of Fashions", ["house of fashions"], "Shopping"),
    ("DSI", ["dsi"], "Shopping"),
    ("Bata", ["bata"], "Shopping"),
    ("SPA Ceylon", ["spa ceylon"], "Shopping"),
    ("Healthguard", ["healthguard"], "Shopping"),
    ("Wickramarachchi", ["wickramarachchi"], "Shopping"),

    # ─── Food & Dining ───
    ("McDonald's", ["mcdonald", "mcdonalds", "maccas"], "Food & Dining"),
    ("KFC", ["kfc", "kentucky fried chicken"], "Food & Dining"),
    ("Burger King", ["burger king", "burgerking"], "Food & Dining"),
    ("Pizza Hut", ["pizza hut", "pizzahut"], "Food & Dining"),
    ("Domino's", ["domino", "dominos", "domino's pizza"], "Food & Dining"),
    ("Subway", ["subway"], "Food & Dining"),
    ("Taco Bell", ["taco bell", "tacobell"], "Food & Dining"),
    ("Barista", ["barista"], "Food & Dining"),
    ("Java Lounge", ["java lounge", "javalounge"], "Food & Dining"),
    ("Coffee Bean", ["coffee bean", "coffee bean & tea leaf"], "Food & Dining"),
    ("Cafe Kumbuk", ["cafe kumbuk", "kumbuk"], "Food & Dining"),
    ("Paan Paan", ["paan paan", "paanpaan"], "Food & Dining"),
    ("BreadTalk", ["breadtalk", "bread talk"], "Food & Dining"),
    ("Perera & Sons", ["perera and sons", "perera & sons", "p&s"], "Food & Dining"),
    ("Fab", ["fab"], "Food & Dining"),
    ("The Cake Factory", ["cake factory", "the cake factory"], "Food & Dining"),
    ("Heladiv Tea Club", ["heladiv tea club", "heladiv"], "Food & Dining"),
    ("Street Burger", ["street burger"], "Food & Dining"),
    ("Chinese Dragon Cafe", ["chinese dragon"], "Food & Dining"),
    ("Elite Indian Restaurant", ["elite indian"], "Food & Dining"),
    ("Mango Mango", ["mango mango"], "Food & Dining"),
    ("BBQ Tonight", ["bbq tonight"], "Food & Dining"),
    ("Burger Hut", ["burger hut"], "Food & Dining"),
    ("Cafe France", ["cafe france"], "Food & Dining"),
    ("Tea Avenue", ["tea avenue"], "Food & Dining"),
    ("Milk Bar", ["milk bar"], "Food & Dining"),

    # ─── Transport ───
    ("Ceypetco", ["ceypetco"], "Transport"),
    ("Lanka IOC", ["lanka ioc", "lanka ioc", "ioc"], "Transport"),
    ("Sinopec", ["sinopec"], "Transport"),
    ("Laugfs Petroleum", ["laugfs petroleum"], "Transport"),
    ("Shell", ["shell"], "Transport"),
    ("Uber", ["uber"], "Transport"),
    ("PickMe", ["pickme", "pick me"], "Transport"),
    ("Kangaroo Cabs", ["kangaroo cabs", "kangaroo"], "Transport"),
    ("TaxiGo", ["taxigo"], "Transport"),
    ("SLTB", ["sltb", "sri lanka transport board", "bus"], "Transport"),
    ("Sri Lanka Railways", ["railways", "railway", "train"], "Transport"),
    ("Expressway Toll", ["expressway", "toll"], "Transport"),

    # ─── Bills & Utilities ───
    ("CEB", ["ceb", "ceylon electricity board", "electricity"], "Bills & Utilities"),
    ("LECO", ["leco", "lanka electricity"], "Bills & Utilities"),
    ("National Water Supply", ["water supply", "water board", "nwsdb"], "Bills & Utilities"),
    ("Dialog", ["dialog", "dialog axiata"], "Bills & Utilities"),
    ("Mobitel", ["mobitel"], "Bills & Utilities"),
    ("SLT", ["slt", "sri lanka telecom"], "Bills & Utilities"),
    ("Hutch", ["hutch"], "Bills & Utilities"),
    ("Airtel", ["airtel"], "Bills & Utilities"),
    ("LankaBell", ["lankabell"], "Bills & Utilities"),
    ("Insurance Premium", ["insurance"], "Bills & Utilities"),

    # ─── Entertainment ───
    ("Scope Cinemas", ["scope", "scope cinemas"], "Entertainment"),
    ("Liberty Cinemas", ["liberty", "liberty cinemas"], "Entertainment"),
    ("Savoy Cinema", ["savoy", "savoy cinema"], "Entertainment"),
    ("PVR Cinemas", ["pvr", "pvr cinemas"], "Entertainment"),
    ("Netflix", ["netflix"], "Entertainment"),
    ("Spotify", ["spotify"], "Entertainment"),
    ("Apple Music", ["apple music"], "Entertainment"),
    ("YouTube Premium", ["youtube premium", "youtube"], "Entertainment"),
    ("Disney+", ["disney", "disney+", "hotstar"], "Entertainment"),
    ("Steam", ["steam"], "Entertainment"),
    ("PlayStation Store", ["playstation", "ps store"], "Entertainment"),
    ("Xbox Store", ["xbox"], "Entertainment"),
    ("Google Play", ["google play"], "Entertainment"),
    ("Apple App Store", ["app store", "apple store"], "Entertainment"),

    # ─── Healthcare ───
    ("Asiri Hospital", ["asiri", "asiri hospital"], "Healthcare"),
    ("Nawaloka Hospital", ["nawaloka", "nawaloka hospital"], "Healthcare"),
    ("Lanka Hospitals", ["lanka hospitals"], "Healthcare"),
    ("Durdans Hospital", ["durdans", "durdans hospital"], "Healthcare"),
    ("Hemas Hospital", ["hemas", "hemas hospital"], "Healthcare"),
    ("Ninewells Hospital", ["ninewells", "ninewells hospital"], "Healthcare"),
    ("Neville Fernando Hospital", ["neville fernando", "nfh"], "Healthcare"),
    ("Union Chemists", ["union chemists"], "Healthcare"),
    ("Osusala", ["osusala"], "Healthcare"),
    ("Pharmacy", ["pharmacy", "pharm"], "Healthcare"),

    # ─── Education ───
    ("University of Colombo", ["university of colombo", "colombo uni"], "Education"),
    ("UCSC", ["ucsc"], "Education"),
    ("University of Moratuwa", ["university of moratuwa", "moratuwa uni"], "Education"),
    ("Open University", ["open university", "ousl"], "Education"),
    ("ESOFT", ["esoft"], "Education"),
    ("NIBM", ["nibm"], "Education"),
    ("SLIIT", ["sliit"], "Education"),
    ("IIT Sri Lanka", ["iit", "iit sri lanka"], "Education"),
    ("Coursera", ["coursera"], "Education"),
    ("Udemy", ["udemy"], "Education"),
    ("British Council", ["british council"], "Education"),

    # ─── Income ───
    ("Salary", ["salary", "payroll"], "Income"),
    ("Freelance Payment", ["freelance", "fiverr", "upwork"], "Income"),
    ("Commission", ["commission"], "Income"),
    ("Allowance", ["allowance"], "Income"),
    ("Refund", ["refund"], "Income"),
    ("Dividend", ["dividend"], "Income"),

    # ─── Banking ───
    ("Commercial Bank", ["commercial bank", "combank"], "Banking"),
    ("HNB", ["hnb", "hatton national bank"], "Banking"),
    ("Sampath Bank", ["sampath", "sampath bank"], "Banking"),
    ("BOC", ["boc", "bank of ceylon"], "Banking"),
    ("People's Bank", ["peoples bank", "people's bank"], "Banking"),
    ("NDB", ["ndb", "national development bank"], "Banking"),
    ("Seylan Bank", ["seylan", "seylan bank"], "Banking"),
    ("DFCC", ["dfcc"], "Banking"),
    ("Nations Trust Bank", ["nations trust", "ntb"], "Banking"),
    ("HSBC", ["hsbc"], "Banking"),
    ("Standard Chartered", ["standard chartered", "stanchart"], "Banking"),

    # ─── Travel ───
    ("Cinnamon Hotels", ["cinnamon", "cinnamon hotels"], "Travel"),
    ("Jetwing Hotels", ["jetwing", "jetwing hotels"], "Travel"),
    ("Aitken Spence Hotels", ["aitken spence"], "Travel"),
    ("Booking.com", ["booking.com", "booking"], "Travel"),
    ("Agoda", ["agoda"], "Travel"),
    ("Airbnb", ["airbnb"], "Travel"),
    ("SriLankan Airlines", ["srilankan", "sri lankan airlines"], "Travel"),
    ("Emirates", ["emirates"], "Travel"),
    ("Qatar Airways", ["qatar airways", "qatar"], "Travel"),

    # ─── Online Shopping ───
    ("Daraz", ["daraz"], "Online Shopping"),
    ("AliExpress", ["aliexpress", "ali express"], "Online Shopping"),
    ("Amazon", ["amazon"], "Online Shopping"),
    ("eBay", ["ebay"], "Online Shopping"),
    ("Temu", ["temu"], "Online Shopping"),
    ("SHEIN", ["shein"], "Online Shopping"),
    ("Kapruka", ["kapruka"], "Online Shopping"),
    ("Wasi", ["wasi.lk", "wasi"], "Online Shopping"),

    # ─── Personal Care ───
    ("Ramani Fernando", ["ramani fernando"], "Personal Care"),
    ("Salon Kess", ["salon kess"], "Personal Care"),
    ("Christell Skin Clinic", ["christell"], "Personal Care"),
    ("Nature's Beauty Creations", ["nature's beauty"], "Personal Care"),
    ("The Body Shop", ["body shop"], "Personal Care"),
    ("Barber Shop", ["barber", "barber shop"], "Personal Care"),
    ("Beauty Parlour", ["beauty parlour", "salon"], "Personal Care"),
]


def run():
    connect_db()
    collection = get_db().get_collection("merchants") if get_db() else None
    if collection is None:
        print("[SEED] Cannot seed — database not connected.")
        sys.exit(1)

    existing = collection.count_documents({})
    if existing > 0:
        print(f"[SEED] Merchants collection already has {existing} document(s).")
        ans = input("Re-seed anyway? (y/N): ")
        if ans.lower() != "y":
            print("[SEED] Aborted.")
            return

    count = 0
    for name, aliases, category in MERCHANTS:
        if seed_merchant(name, aliases, category):
            count += 1

    print(f"[SEED] Done. {count} merchants inserted/verified.")


if __name__ == "__main__":
    run()

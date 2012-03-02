#!/usr/bin/env python3
import lxml.etree, lxml.html
import urllib.parse, urllib.request
import os
from datetime import date
from dateutil.relativedelta import relativedelta


WEIGHTED_USAGE_STATS_URL="http://valssi.fixme.fi/~lamperi/cgi-bin/weighted_ranked_stats.py"
PARAMS={'stats1': None, 'stats2': None, 'w1': 1, 'w2': 2}
MONTHLY_STATS="http://stats.pokemon-online.eu/Past Stats/{month}-{year}/{tier}/ranked_stats.txt"

TIER_TREES = [
    ["Wifi OU", "Wifi UU", "Wifi LU", "Wifi NU"],
    ["DW OU", "DW UU"]
]

BANLIST = {
    "Wifi OU": ["Mewtwo", "Ho-Oh", "Lugia", "Kyogre", "Groudon", "Rayquaza", "Manaphy", "Dialga", "Palkia", "Giratina", "Giratina-O", "Arceus", "Darkrai", "Shaymin-S", "Reshiram", "Zekrom", "Deoxys", "Deoxys-A", "Deoxys-S", "Excadrill", "Blaziken", "Garchomp", "Thundurus"], # Ubers
    "Wifi UU": ["Kingdra", "Kyurem", "Latias", "Roserade", "Smeargle", "Staraptor", "Venomoth", "Wobbuffet"], # BL
    "Wifi LU": ["Cresselia", "Gorebyss", "Huntail", "Victini", "Rhyperior", "Omastar", "Medicham", "Durant", "Virizion", "Moltres", "Sharpedo"], # BL2
    "Wifi NU": ["Feraligatr", "Sawsbuck", "Gligar", "Braviary", "Charizard", "Hitmonlee", "Scolipede", "Tangela", "Jynx"], # BL3
    "DW OU": ["Mewtwo", "Ho-Oh", "Lugia", "Kyogre", "Groudon", "Rayquaza", "Manaphy", "Dialga", "Palkia", "Giratina", "Giratina-O", "Arceus", "Darkrai", "Shaymin-S", "Reshiram", "Zekrom", "Deoxys", "Deoxys-A", "Blaziken", "Garchomp", "Thundurus", "Chandelure"], # DW Ubers
    "DW UU": ["Azelf", "Chansey", "Deoxys", "Deoxys-D", "Froslass", "Haxorus", "Hydreigon", "Kyurem", "Lampent", "Latias", "Lucario", "Mew", "Roserade", "Scrafty", "Smeargle", "Staraptor", "Terrakion", "Venomoth", "Vulpix"], # DW BL
}
ADDITIONAL_BANS = {
    "Wifi UU": ["Vulpix"], # Due to Drought being banned
    "Wifi LU": ["Abomasnow", "Snover"], # Due to Snow Warning being banned
}

ITEM_BANS = {
    "Wifi NU": "Damp Rock"
}

def get_po_tiers():
    tree = lxml.etree.ElementTree()
    if os.path.exists("tiers.xml"):
        tree.parse("tiers.xml")
    return tree

def write_po_tiers(po_tiers):
    with open("tiers.xml", "wb") as f:
        f.write(lxml.etree.tostring(po_tiers).replace(b'\n', b'\r\n'))

def merge_values(s1, s2):
    set1 = set(s.strip() for s in s1.split(","))
    set2 = set(s.strip() for s in s2.split(","))
    ret = ', '.join(sorted(list((set1 | set2))))
    return ret

def deserialize_bans(str):
    return set(s.strip() for s in str.split(","))

def serialize_bans(set):
    return ", ".join(sorted(list(set)))    

def get_ranked_stats(tier):
    today = date.today()
    last_month = today + relativedelta(months = -1)
    previous_month =  today + relativedelta(months = -2)
    last_month_url = MONTHLY_STATS.format(month=last_month.strftime("%B").lower(), year=last_month.year, tier=tier)
    previous_month_url = MONTHLY_STATS.format(month=previous_month.strftime("%B").lower(), year=previous_month.year, tier=tier)
    PARAMS["stats1"] = previous_month_url.replace(" ", "%20")
    PARAMS["stats2"] = last_month_url.replace(" ", "%20")
    url = "{page}?{query}".format(page=WEIGHTED_USAGE_STATS_URL, query=urllib.parse.urlencode(PARAMS))
    page = lxml.html.parse(url)
    return [line.rsplit(None, 2) for line in page.find("//pre").text.splitlines()[2:-1]]

def update_tiers(tiers):
    for USAGE_TREE in TIER_TREES:
        all_bans = set(BANLIST.get(USAGE_TREE[0],[]))
        for ban_parent,tier in zip(USAGE_TREE[:-1], USAGE_TREE[1:]):
            print("Downloading ranked stats for {tier}...".format(tier=ban_parent), end=" ")
            stats = get_ranked_stats(ban_parent)
            print("Calculating banlists for {tier}...".format(tier=tier), end = " ")
            top_usage = [entry[0] for entry in stats if float(entry[1]) >= 4.0]
            pokemon_bans = set(top_usage) | set(BANLIST.get(tier,[])) | set(ADDITIONAL_BANS.get(tier,[]))

            element = tiers.find(".//tier[@name='{tier}']".format(tier=tier))
            
            pokemons = element.attrib["pokemons"]
            current_bans = deserialize_bans(pokemons)
            all_bans = all_bans | pokemon_bans
            missing_bans = pokemon_bans - current_bans
            extra_bans = current_bans - pokemon_bans
            weird_bans = current_bans - all_bans
            removable_bans = extra_bans - weird_bans
            print("Calculated.")

            if weird_bans:
                print("Unknown bans present: {bans}".format(bans=weird_bans))
            if missing_bans or removable_bans:
                print("Proposed changes:")
                if missing_bans:
                    print("Add bans for {missing} as they should be banned by usage or banlist.".format(missing=missing_bans))
                if removable_bans:
                    print("Remove bans for {extra} as they are banned in parent tiers.".format(extra=removable_bans))
                ans = input("Proceed with changes? [Y/n] ")
                if ans == "" or ans.upper().startswith("Y"):
                    bans = (current_bans | missing_bans) - removable_bans
                    element.attrib["pokemons"] = serialize_bans(bans)
                    print("Tier {tier} updated!".format(tier=tier))
                else:
                    print("Tier {tier} not updated.".format(tier=tier))
            else:
                print("Tier {tier} seems fine.".format(tier=tier))

    print("")
    return tiers
    
if __name__ == "__main__":
    print("Reading PO tiers")
    po_tiers = get_po_tiers()
    print("Updating PO tiers...")
    po_tiers = update_tiers(po_tiers)
    print("Writing PO tiers")
    write_po_tiers(po_tiers)
    print("Done")

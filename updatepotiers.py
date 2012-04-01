#!/usr/bin/env python3
import lxml.etree, lxml.html
import urllib.parse, urllib.request
import os
import sys
from copy import copy
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
    "Wifi UU": ["Kingdra", "Kyurem", "Latias", "Roserade", "Smeargle", "Staraptor", "Venomoth", "Wobbuffet", "Deoxys-D"], # BL
    "Wifi LU": ["Cresselia", "Gorebyss", "Huntail", "Victini", "Rhyperior", "Omastar", "Medicham", "Durant", "Virizion", "Moltres", "Sharpedo"], # BL2
    "Wifi NU": ["Feraligatr", "Sawsbuck", "Gligar", "Braviary", "Charizard", "Hitmonlee", "Scolipede", "Tangela", "Jynx", "Misdreavus", "Cacturne"], # BL3
    "DW OU": ["Mewtwo", "Ho-Oh", "Lugia", "Kyogre", "Groudon", "Rayquaza", "Manaphy", "Dialga", "Palkia", "Giratina", "Giratina-O", "Arceus", "Darkrai", "Shaymin-S", "Reshiram", "Zekrom", "Deoxys", "Deoxys-A", "Blaziken", "Garchomp", "Chandelure", "Excadrill"], # DW Ubers
    "DW UU": ["Azelf", "Chansey", "Deoxys", "Deoxys-S", "Froslass", "Haxorus", "Hydreigon", "Kyurem", "Landorus", "Latias", "Lucario", "Roserade", "Scrafty", "Smeargle", "Staraptor", "Terrakion", "Venomoth", "Vulpix", "Wobbuffet"], # DW BL
}
ADDITIONAL_BANS = {
    "Wifi UU": ["Vulpix", # Due to Drought being banned
                "Abomasnow", "Snover"], # Due to Snow Warning being banned
    "DW UU":   ["Thundurus"], # Due to being uber for some time
}

# TODO: enforce these
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

def deserialize_bans(str):
    return set(s.strip() for s in str.split(","))

def serialize_bans(set):
    return ", ".join(sorted(list(set)))    

def get_ranked_stats(tier):
    today = date.today()
    even_month = -1 if today.month % 2 == 0 else 0
    last_month = today + relativedelta(months = -1 + even_month)
    previous_month =  today + relativedelta(months = -2 + even_month)
    last_month_url = MONTHLY_STATS.format(month=last_month.strftime("%B").lower(), year=last_month.year, tier=tier)
    previous_month_url = MONTHLY_STATS.format(month=previous_month.strftime("%B").lower(), year=previous_month.year, tier=tier)
    PARAMS["stats1"] = previous_month_url.replace(" ", "%20")
    PARAMS["stats2"] = last_month_url.replace(" ", "%20")
    url = "{page}?{query}".format(page=WEIGHTED_USAGE_STATS_URL, query=urllib.parse.urlencode(PARAMS))
    if "--show-url" in sys.argv:
        print("Ranked stats for {tier} are at {url}".format(tier=tier, url=url))
    page = lxml.html.parse(url)
    return [line.rsplit(None, 2) for line in page.find("//pre").text.splitlines()[2:-1]]

def update_tiers(tiers):
    for USAGE_TREE in TIER_TREES:
        all_bans = set(BANLIST.get(USAGE_TREE[0],[]))
        tier_usage = {}
        tier_pokemon = {}
        ban_parent = None
        grand_ban_parent = None
        for tier in USAGE_TREE:
            # Find bans by parent tier top usage
            top_usage = set()
            print("Calculating banlists for {tier}...".format(tier=tier), end = " ")
            if ban_parent:
                print("Downloading ranked stats for {tier}...".format(tier=ban_parent), end=" ")
                stats = get_ranked_stats(ban_parent)
                tier_usage[ban_parent] = dict((s[0], float(s[1])) for s in stats)

                tier_pokemon[ban_parent] = [entry[0] for entry in stats if float(entry[1]) >= 4.0]

            # Bans 
            parent_pokemon = tier_pokemon[ban_parent] if ban_parent else set()
            usage_bans = set(parent_pokemon) 
            banlist_bans = set(BANLIST.get(tier,[])) | set(ADDITIONAL_BANS.get(tier,[]))
            pokemon_bans = usage_bans | banlist_bans

            element = tiers.find(".//tier[@name='{tier}']".format(tier=tier))
 
            drops = set()
            if grand_ban_parent:
                # Calculate drops using very heuristic approach.
                for pokemon in tier_usage[grand_ban_parent]:
                    if pokemon not in (all_bans | pokemon_bans) and 0.1 < tier_usage[grand_ban_parent][pokemon] < 4.0 and tier_usage[ban_parent].get(pokemon, 0) * 20 < tier_usage[grand_ban_parent][pokemon]:
                        drops.add(pokemon)
            pokemon_bans |= drops            
 
            current_bans = deserialize_bans(element.attrib["pokemons"])
            all_bans = all_bans | pokemon_bans
            missing_bans = pokemon_bans - current_bans
            extra_bans = current_bans - pokemon_bans
            likely_drops = current_bans - all_bans
            removable_bans = extra_bans - likely_drops
            print("Calculated.")
 
            if drops:
                print("Likely dropped from {grand_parent} to {parent}: {pokes}. Added to {tier} ban list.".format(pokes=drops, grand_parent=grand_ban_parent, parent=ban_parent, tier=tier))
            if missing_bans or removable_bans or likely_drops:
                bans = copy(current_bans)
                print("Proposed changes:")
                for reason, missing_subset in (("usage", usage_bans), ("banlist", banlist_bans), ("dropping from grandparent", drops)):
                    ban_subset = missing_subset - current_bans
                    if ban_subset:
                        print("Add bans for {pokemon} as they should be banned by {reason}.".format(pokemon=ban_subset, reason=reason))
                        ans = input("Proceed with changes? [Y/n] ")
                        if ans == "" or ans.upper().startswith("Y"):
                            bans |= ban_subset

                if removable_bans:
                    print("Remove bans for {extra} as they are banned in parent tiers.".format(extra=removable_bans))
                    ans = input("Proceed with changes? [Y/n] ")
                    if ans == "" or ans.upper().startswith("Y"):
                        bans -= removable_bans

                if likely_drops:
                    print("These pokemon have fell in usage or have been removed from banlist {bans} and their bans are to be removed.".format(bans=likely_drops))
                    ans = input("Proceed with changes? [Y/n] ")
                    if ans == "" or ans.upper().startswith("Y"):
                        bans -= likely_drops 

                if bans != current_bans:
                    element.attrib["pokemons"] = serialize_bans(bans)
                    print("Tier {tier} updated!".format(tier=tier))
                else:
                    print("Tier {tier} not updated.".format(tier=tier))
            else:
                print("Tier {tier} seems fine.".format(tier=tier))
            grand_ban_parent = ban_parent
            ban_parent = tier

    return tiers
    
if __name__ == "__main__":
    print("Reading PO tiers")
    po_tiers = get_po_tiers()
    print("Updating PO tiers...")
    po_tiers = update_tiers(po_tiers)
    print("Writing PO tiers")
    write_po_tiers(po_tiers)
    print("Done")

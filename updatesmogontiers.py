#!/usr/bin/env python3
import shlex
import subprocess
import os
import re
import lxml.etree as etree

TIERS_YML_URL="https://raw.github.com/sarenji/poserver/HEAD/tiers.yml"
TIERS_COMPILER_URL="https://raw.github.com/sarenji/poserver/HEAD/tiers_compiler.rb"

TIERS_TO_UPDATE = {
  'Standard OU': 'Smogon OU',
  'Standard UU': 'Smogon UU',
  'Standard RU': 'Smogon RU',
  'Standard NU': 'Smogon NU'
}
ADD_BANLIST = {
  'Standard OU': ['Standard Ubers']
}
class InvalidTierException(Exception):
    pass

def shell_exec(cmd_line, shell=False):
    return subprocess.Popen(shlex.split(cmd_line), stdout=subprocess.PIPE).communicate()[0]

def download_smogon_tiers(download=True):
    if download:
        shell_exec("mkdir -p smogon")
        shell_exec("rm -f smogon/tiers.xml smogon/tiers.yml")
        shell_exec("wget {0} -q -Osmogon/tiers.yml".format(TIERS_YML_URL))
        shell_exec("wget {0} -q -Osmogon/tiers_compiler.rb".format(TIERS_COMPILER_URL))
        os.chdir("smogon"); shell_exec("ruby tiers_compiler.rb"); os.chdir("..")

    tree = etree.ElementTree()
    if os.path.exists("smogon/tiers.xml"):
        tree.parse("smogon/tiers.xml")
    return tree

def get_po_tiers():
    tree = etree.ElementTree()
    if os.path.exists("tiers.xml"):
        tree.parse("tiers.xml")
    return tree

def write_po_tiers(po_tiers):
    with open("tiers.xml", "wb") as f:
        f.write(etree.tostring(po_tiers).replace(b'\n', b'\r\n'))

def merge_values(s1, s2):
    set1 = set(s.strip() for s in s1.split(","))
    set2 = set(s.strip() for s in s2.split(","))
    ret = ', '.join(sorted(list((set1 | set2))))
    return ret

def update_tiers(smogon_tiers, po_tiers):
    for smogon_tier,po_tier in TIERS_TO_UPDATE.items():
        print("{0} -> {1}...".format(smogon_tier, po_tier), end=" ")

        smogon_element = smogon_tiers.find(".//tier[@name='{0}']".format(smogon_tier))
        if smogon_element is None:
            raise InvalidTierException("Smogon tier '{0}' does not exist".format(smogon_tier))

        if smogon_tier in ADD_BANLIST:
           for banlistname in ADD_BANLIST[smogon_tier]:
               banlist = smogon_tiers.find(".//tier[@name='{0}']".format(banlistname))
               if banlist is None:
                   raise InvalidTierException("Ban list does not exist: {0}'".format(banlistname))
               if banlist.attrib["banMode"] != smogon_element.attrib["banMode"]:
                   raise InvalidTierException("Ban list mode does not match for '{0}' and '{1}'".format(smogon_tier, banlistname))
               for key in ["pokemons", "restrictedPokemons", "items", "moves"]:
                   smogon_element.attrib[key] = merge_values(smogon_element.attrib[key], banlist.attrib[key])

        po_element = po_tiers.find(".//tier[@name='{0}']".format(po_tier))

        for key in ["pokemons", "restrictedPokemons", "banMode", "maxLevel", "mode", "gen", "moves", "items", "numberOfPokemons", "clauses"]:
            po_element.attrib[key] = smogon_element.attrib[key]

    print("")
    return po_tiers
    
if __name__ == "__main__":
    print("Downloading Smogon tiers")
    smogon_tiers = download_smogon_tiers(download=True)
    print("Reading PO tiers")
    po_tiers = get_po_tiers()
    print("Merging Smogon tiers to PO tiers...", end=" ")
    po_tiers = update_tiers(smogon_tiers, po_tiers)
    print("Writing PO tiers")
    write_po_tiers(po_tiers)
    print("Done")
    print("You can now remove the temporary directory 'smogon' if you want.")

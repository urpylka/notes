#! /usr/bin/env python3

import re, time

srcfile = "./grafana.sql"
resfile = "./resfile.sql"

print("\033[1m#\n# This program is for preparing SQL converted from SQLite to PostgreSQL")
print("# Source file: " + srcfile)
print("# Result file: " + resfile)
print("#\033[0;0m\n")

last_time = int(time.time())
def howlong():
    global last_time
    _now = int(time.time())
    _dif = _now - last_time
    last_time = _now
    return " (%ss)\n" % (_dif)

doings = 23

with open(srcfile, 'r') as f:
    print("> 1/%d Uploading the source file to the memory" % (doings))
    content = f.read()
    print("✅ Done" + howlong())

    print("> 2/%d Deleting all statements except 'INSERT INTO' " % (doings))
    match = re.compile("(?m)[\r\n]*^(?!INSERT INTO.*)(.*)$", re.IGNORECASE)
    content = match.sub('', content)
    print("✅ Done" + howlong())

    print("> 3/%d Removing inserts to 'sqlite_sequence', 'user_auth'" % (doings))
    match = re.compile("(?m)[\r\n]*^INSERT INTO (sqlite_sequence|user_auth) VALUES.*;$", re.IGNORECASE)
    content = match.sub('', content)
    print("✅ Done" + howlong())

    print("> 4/%d Fix char conversion (char -> chr)" % (doings))
    match = re.compile("char\(10\)\)", re.IGNORECASE)
    content = match.sub('chr(10))', content)
    print("✅ Done" + howlong())

    print("> 5/%d Fixing HEX syntax for 'dashboard_snapshot'" % (doings))
    match = re.compile("(?m)(?<=^INSERT INTO dashboard_snapshot VALUES\()(.*)(,X\')([a-fA-F0-9]+\')", re.IGNORECASE)
    content = match.sub(r"\1,'\\x\3", content)
    print("✅ Done" + howlong())

    print("> 6/%d Fixing HEX syntax for 'data_keys'" % (doings))
    match = re.compile("(?m)(?<=^INSERT INTO data_keys VALUES\()(.*)(,X\')([a-fA-F0-9]+\')", re.IGNORECASE)
    content = match.sub(r"\1,'\\x\3", content)
    print("✅ Done" + howlong())

    def nodecode(hexmatch):
        _hexmatch = hexmatch.group(1)[2:] # cut X
        _hexmatch = ",convert_from(decode(" + _hexmatch + ",'hex'),'utf-8')"
        return _hexmatch

    print("> 7/%d Wrapping HEX data" % (doings))
    match = re.compile("(,X\'[a-fA-F0-9]*\')")
    content = match.sub(nodecode, content)
    print("✅ Done" + howlong())

    bool_pos = {
        "alert": [13],
        "alert_configuration": [5],
        "alert_notification": [8, 10, 11],
        "api_key": [11],
        "dashboard": [14, 15, 17],
        "dashboard_snapshot": [7],
        "data_keys": [2],
        "data_source": [11, 14, 18, 20],
        "migration_log": [4],
        "plugin_setting": [4, 5],
        "role": [11],
        "team_member": [7],
        "user": [11, 12, 18, 19],
        "user_auth_token": [7],
    }

    def list_conv(_match):
        l = []
        state = "empty" # "empty", "null", "digit", "string", "sqlfunc"
        word = ""
        quotes = 0

        for i in range(len(_match)):
            match _match[i]:
                case '\'':
                    if state == "empty":
                        state = "string"
                    elif state == "string":
                        if _match[i-1] != '\\':
                            state = "empty"
                    word += _match[i]
                case ',':
                    if state == "empty" or state == "digit" or state == "null":
                        l.append(word)
                        word = ""
                        state = "empty"
                    else:
                        word += _match[i]
                case '(':
                    if state == "sqlfunc":
                        if _match[i-1] != '\\':
                            quotes += 1
                    word += _match[i]
                case ')':
                    if state == "sqlfunc":
                        if _match[i-1] != '\\':
                            quotes -= 1
                        if quotes == 0:
                            state = "empty"
                    word += _match[i]
                case _:
                    if state == "empty":
                        if _match[i].isdigit():
                            state = "digit"
                        elif _match[i].isalpha():
                            if _match[i] == "N":
                                state = "null"
                            else:
                                state = "sqlfunc"


                    word += _match[i]
        l.append(word)
        return l

    def bool_conv(_table, _match):
        splited = list_conv(_match.group(0))
        global bool_pos
        res = ""
        for i in bool_pos[_table]:
            match splited[i-1]:
                case '0':
                    splited[i-1] = "FALSE"
                case '1':
                    splited[i-1] = "TRUE"
                case 'NULL':
                    splited[i-1] = "NULL"
                case 'null':
                    splited[i-1] = "NULL"
                case _:
                    print("Error: This value should be boolean!")
                    print("Position: %s, value: %s" % (i,splited[i-1]))
                    print("Table: %s, data: %s" % (_table,splited))
                    exit(1)
        return ','.join(splited)

    i = 7 # doings before
    for table in bool_pos:
        i += 1
        print("> %d/%d Fixing boolean values for '%s'" % (i, doings, table))
        match = re.compile("(?<=INSERT INTO %s VALUES\().*(?=\);)" % (table), re.IGNORECASE)
        content = match.sub(lambda match: bool_conv(table, match), content)
        print("✅ Done" + howlong())

    print("> 22/%d Setting quotes above tables name" % (doings))
    match = re.compile("(?<=INSERT INTO )([\w]+)(?= VALUES\(.*\);)", re.IGNORECASE)
    content = match.sub(r'"\1"', content)
    print("✅ Done" + howlong())

    print("> %d/%d Saving result to %s" % (doings, doings, resfile))
    with open(resfile, 'w') as f2:
        f2.write(content)
    print("🎉 Done" + howlong())

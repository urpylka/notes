function get_surname(obj) {
    if (obj["surn"] != null) return obj["surn"];
    else if (obj["marn"] != null) return obj["marn"] + "*";
    return null
};

function get_full_name(obj) {

    let noname = "Noname";

    let last_name = get_surname(obj);
    let first_name = obj["firn"];
    let second_name = obj["secn"];

    let full_name = (first_name) ? first_name : noname;
    if (last_name) full_name = last_name + ' ' + full_name;
    if (second_name) full_name = full_name + ' ' + second_name;

    return full_name;
};

function get_life(obj) {
    let bday = obj["bday"],
        dday = obj["dday"],
        label = (bday !== "") ? bday : "";
    return (dday !== "") ? label + '–' + dday : label;
}
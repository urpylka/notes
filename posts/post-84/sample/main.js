var myDiagram = null;

function init(my_array) {
    //if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
    let $ = go.GraphObject.make;
    // myDiagram = null;
    myDiagram = $(go.Diagram, "myDiagramDiv",
        {
            initialAutoScale: go.Diagram.Uniform,
            initialContentAlignment: go.Spot.Center,
            "undoManager.isEnabled": true,

            // when a node is selected, draw a big yellow circle behind it
            nodeSelectionAdornmentTemplate:
                $(
                    go.Adornment, "Auto",
                    { layerName: "Grid" },  // the predefined layer that is behind everything else
                    $(go.Shape, "Circle", { fill: "yellow", stroke: null }),
                    $(go.Placeholder)
                ),

            // use a custom layout, defined below
            layout: $(GenogramLayout, { direction: 90, layerSpacing: 50, columnSpacing: 40 })
            // layout: $(GenogramLayout, { direction: 90, layerSpacing: 30, columnSpacing: 10 })
            // layout: $(go.TreeLayout, { angle: 90, layerSpacing: 35 })

        }
    );

    // Template for male
    myDiagram.nodeTemplateMap.add("M",
        $(go.Node, "Vertical", { locationSpot: go.Spot.Center, locationObjectName: "ICON" },
            $(go.Panel, { name: "ICON" },
                $(go.Shape, "Square", { width: 40, height: 40, strokeWidth: 2, fill: "white", portId: "" }),
                $(go.TextBlock, { margin: 3, textAlign: "center", maxSize: new go.Size(80, NaN) }, new go.Binding("text", "key"))
            ),
            $(go.TextBlock, { textAlign: "center", maxSize: new go.Size(80, NaN) }, new go.Binding("text", "n")),
            $(go.TextBlock, { textAlign: "center", maxSize: new go.Size(80, NaN) }, new go.Binding("text", "bday")),
            $(go.TextBlock, { textAlign: "center", maxSize: new go.Size(80, NaN) }, new go.Binding("text", "dday"))
        )
    );

    // Template for fermale
    myDiagram.nodeTemplateMap.add("F",
        $(go.Node, "Vertical", { locationSpot: go.Spot.Center, locationObjectName: "ICON" },
            $(go.Panel, { name: "ICON" },
                $(go.Shape, "Circle", { width: 40, height: 40, strokeWidth: 2, fill: "white", portId: "" }),
                $(go.TextBlock, { margin: 10, textAlign: "center", maxSize: new go.Size(80, NaN) }, new go.Binding("text", "key"))
            ),
            $(go.TextBlock, { textAlign: "center", maxSize: new go.Size(80, NaN) }, new go.Binding("text", "n")),
            $(go.TextBlock, { textAlign: "center", maxSize: new go.Size(80, NaN) }, new go.Binding("text", "bday")),
            $(go.TextBlock, { textAlign: "center", maxSize: new go.Size(80, NaN) }, new go.Binding("text", "dday"))
        )
    );

    // the representation of each label node -- nothing shows on a Marriage Link
    myDiagram.nodeTemplateMap.add("LinkLabel",
        $(go.Node, { selectable: false, width: 1, height: 1, fromEndSegmentLength: 20 })
    );

    // for parent-child relationships
    myDiagram.linkTemplate = $(go.Link,
        {
            // routing: go.Link.Orthogonal, curviness: 1,
            routing: go.Link.Normal, curviness: 1,
            layerName: "Background", selectable: false,
            fromSpot: go.Spot.Bottom, toSpot: go.Spot.Top
        },
        $(go.Shape, { strokeWidth: 2 })
    );

    // for marriage relationships
    myDiagram.linkTemplateMap.add("Marriage",
        $(go.Link,
            { selectable: false },
            $(go.Shape, { strokeWidth: 2, stroke: "blue" })
        )
    );

    setupDiagram(myDiagram, my_array, 0 /* focus on this person */);
}

function load_localstorage() {
    // https://tproger.ru/articles/localstorage/
    // https://habr.com/post/349164/
    try {
        let returnObj = JSON.parse(localStorage.getItem("json_db"));
        // if (myDiagram != null) myDiagram.clearHighlighteds();

        if (returnObj != null) {
            // Чтобы не было ошибки
            init(returnObj);
        } else {
            let res = confirm("Это демонстрация прототипа проекта genogram.\n\nДля работы необходимо загрузить файл с соотвествующими полями в формате csv или json.\n\nВы можете загрузить преднастроенное семейное дерево разработчика данного проекта.\n\nДля это нажмите 'OK'.");
            if (res) { load_url_file(); }
        }
    } catch (e) { alert(e); }
}

function remove_cur_diagram() {
    my_div = document.getElementById("myDiagramDiv")
    my_div.remove();

    let div = document.createElement('div');
    div.setAttribute("id", "myDiagramDiv");
    document.body.append(div);
}

function load_url_file() {

    const request = new XMLHttpRequest();
    const url = "./genogram.json";
    const params = "";

    request.open("POST", url, true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    request.addEventListener("readystatechange", () => {

        if (request.readyState === 4 && request.status === 200) {
            let obj = request.response;

            // console.log(obj);
            let parse = JSON.parse(obj);
            // console.log(parse);
            localStorage.setItem("json_db", JSON.stringify(parse));

            remove_cur_diagram();
            load_localstorage();
        }
    });

    request.send(params);

};

function clear_localstorage() {
    remove_cur_diagram();
    localStorage.removeItem("json_db");
}

function load_file() {
    let reader = new FileReader();

    reader.onload = function () {

        let arrayBuffer = this.result,
            array = new Uint8Array(arrayBuffer),
            // binaryString = String.fromCharCode.apply(null, array),
            // https://ourcodeworld.com/articles/read/164/how-to-convert-an-uint8array-to-string-in-javascript
            binaryString = new TextDecoder("utf-8").decode(array);

        // console.log(arrayBuffer);
        console.log(binaryString);
        // init(parse);


        // check file ext
        // https://ru.stackoverflow.com/questions/468741/Как-проверить-размер-и-расширение-файла-до-загрузки-на-сервер
        let file = document.getElementById("uploadInput").files[0],
            ext = null,
            parts = file.name.split('.');
        if (parts.length > 1) ext = parts.pop();

        // https://stackoverflow.com/questions/46632093/getting-security-error-on-iphone-when-using-localstorage
        // https://stackoverflow.com/questions/14555347/html5-localstorage-error-with-safari-quota-exceeded-err-dom-exception-22-an
        try {
            if (ext == "json") {
                let parse = JSON.parse(binaryString);
                console.log(parse);
                localStorage.setItem("json_db", JSON.stringify(parse));
                remove_cur_diagram();
                load_localstorage();
            }
            else if (ext == "csv") {
                // https://ruseller.com/lessons.php?rub=32&id=2070
                // https://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data

                let results = Papa.parse(binaryString, { header: true });
                console.log(results.data);
                localStorage.setItem("json_db", JSON.stringify(results.data));
                remove_cur_diagram();
                load_localstorage();
            }
            else throw Error("Unsupported extension: " + ext);
        } catch (e) { alert(e); }
    };

    reader.readAsArrayBuffer(document.getElementById("uploadInput").files[0])
};

// Old download function
// function download(content, fileName, contentType) {
//     var a = document.createElement("a");
//     var file = new Blob([content], { type: contentType });
//     a.href = URL.createObjectURL(file);
//     a.download = fileName;
//     a.click();
// }

// When the blob is complete, make an anchor tag for it and use the tag to initiate a download
// Works in:
// * Chrome
// * IE11, Edge
// * Firefox
function download(strobj, filename, contenttype) {
    let blob = new Blob([strobj], { type: contenttype });

    let url = window.URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = filename;

    // IE 11
    if (window.navigator.msSaveBlob !== undefined) {
        window.navigator.msSaveBlob(blob, filename);
        return;
    }

    document.body.appendChild(a);
    requestAnimationFrame(function () {
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
}

function save_svg() {
    var svg = myDiagram.makeSvg({ scale: 1, background: "white" });
    var svgstr = new XMLSerializer().serializeToString(svg);
    download(svgstr, "genogram.svg", "image/svg+xml");
};

function save_json() {
    my_data = JSON.stringify(myDiagram.model.nodeDataArray);
    // нужно почистить здесь все, тк массив модели содержет
    // и ребра и другие вспомогательные штуки необходимые для построения
    console.log(my_data);
    download(my_data, "genogram.json", "text/plain");
};

function save_localstorage() {
    let returnObj = JSON.parse(localStorage.getItem("json_db"));
    // нереализовано
}

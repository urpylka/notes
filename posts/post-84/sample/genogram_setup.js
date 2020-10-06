
// create and initialize the Diagram.model given an array of node data representing people
function setupDiagram(diagram, array, focusId) {

  for (let i = 0; i < array.length; i++)
  {
    array[i]['n'] = get_full_name(array[i]);
    //array[i]['l'] = get_life(array[i]);
  }
  //console.log(array);

  setupModel(diagram, array);
  setupParents(diagram);
  focusItem(diagram, focusId);
};

function setupModel(diagram, array) {

  diagram.model = go.GraphObject.make(
    go.GraphLinksModel,
    {
      // declare support for link label nodes
      linkLabelKeysProperty: "labelKeys",
      // this property determines which template is used
      nodeCategoryProperty: "s",
      // create all of the nodes for people
      nodeDataArray: array
    }
  );
}

function focusItem(diagram, focusId) {
  // Выделение выбранного элемента
  var node = diagram.findNodeForKey(focusId);
  if (node !== null) {
    diagram.select(node);
    // remove any spouse for the person under focus:
    //node.linksConnected.each(function(l) {
    //  if (!l.isLabeledLink) return;
    //  l.opacity = 0;
    //  var spouse = l.getOtherNode(node);
    //  spouse.opacity = 0;
    //  spouse.pickable = false;
    //});
  }
}

function findMarriage(diagram, a, b) {  // A and B are node keys
  var nodeA = diagram.findNodeForKey(a);
  var nodeB = diagram.findNodeForKey(b);
  if (nodeA !== null && nodeB !== null) {
    var it = nodeA.findLinksBetween(nodeB);  // in either direction
    while (it.next()) {
      var link = it.value;
      // Link.data.category === "Marriage" means it's a marriage relationship
      if (link.data !== null && link.data.category === "Marriage") return link;
    }
  }
  return null;
}

// process parent-child relationships once all marriages are known
function setupParents(diagram) {
  let model = diagram.model;
  let nodeDataArray = model.nodeDataArray;

  for (let i = 0; i < nodeDataArray.length; i++) {
    let data = nodeDataArray[i];
    let key = data.key;
    let mother = data.m;
    let father = data.f;

    // if (mother == undefined)
    // {
    //   mother = { s: "M" };
    //   model.addNodeData(mother);
    // }
    // if (father == undefined)
    // {
    //   father = { s: "F" };
    //   model.addNodeData(father);
    // }
    // let link = findMarriage(diagram, mother, father);
    // mdata = link.data;
    // let mlabkey = mdata.labelKeys[0];
    // let cdata = { from: mlabkey, to: key };
    // model.addLinkData(cdata);

    if (mother !== undefined && mother !== "") {
      if (father !== undefined && father !== "") {
        // определен и мать и отец
        let mdata = null;
        // если связь уже создана, чтобы не создавать новую
        let link = findMarriage(diagram, mother, father);
        if (link === null) {
          // add a label node for the marriage link
          let mlab = { s: "LinkLabel" };
          model.addNodeData(mlab);
          // add the marriage link itself, also referring to the label node
          mdata = { from: father, to: mother, labelKeys: [mlab.key], category: "Marriage" };
          model.addLinkData(mdata);
        }
        else {
          // если связь имеется
          mdata = link.data;
        }

        let mlabkey = mdata.labelKeys[0];
        let cdata = { from: mlabkey, to: key };
        model.addLinkData(cdata);
      } else {
        // определена мать

        // var mlab = { s: "LinkLabel" };
        // model.addNodeData(mlab);
        // // add the marriage link itself, also referring to the label node
        // var mdata = { from: mlab.key, to: mother};
        // model.addLinkData(mdata);

        // let fictivFather = { s: "M" };
        // model.addNodeData(fictivFather);
        // let fdata = { from: mother, to: key, labelKeys: [fictivFather.key], category: "Marriage" };
        // model.addLinkData(fdata);

        let mdata = { from: mother, to: key };
        model.addLinkData(mdata);
      }
    } else {
      if (father !== undefined) {
        // определен только отец
        let fdata = { from: father, to: key };
        model.addLinkData(fdata);
      }
      else {
        // если не определен никто

        // or warn no known mother or no known father or no known marriage between them
        if (window.console) window.console.log("unknown marriage: " + mother + " & " + father);
        continue;
      }
    }
  }
}
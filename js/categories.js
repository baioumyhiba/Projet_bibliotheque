function loadCategories() {
    let xhrXML = new XMLHttpRequest();
    let xhrXSL = new XMLHttpRequest();

    xhrXML.open("GET", "xml/categories.xml", true);
    xhrXSL.open("GET", "xslt/categories.xsl", true);

    xhrXML.onreadystatechange = function() {
        if(xhrXML.readyState === 4 && xhrXML.status === 200) {
            xhrXSL.onreadystatechange = function() {
                if(xhrXSL.readyState === 4 && xhrXSL.status === 200) {
                    let xml = xhrXML.responseXML;
                    let xsl = xhrXSL.responseXML;

                    let xsltProcessor = new XSLTProcessor();
                    xsltProcessor.importStylesheet(xsl);
                    let result = xsltProcessor.transformToFragment(xml, document);
                    document.getElementById("categoriesDiv").appendChild(result);
                }
            };
            xhrXSL.send();
        }
    };
    xhrXML.send();
}

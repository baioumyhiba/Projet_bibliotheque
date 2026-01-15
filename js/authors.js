function loadAuthors() {
    // Crée un objet XMLHttpRequest
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "data/authors/authors.xml", true);
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            var xml = this.responseXML;

            // Charge le XSL
            var xslRequest = new XMLHttpRequest();
            xslRequest.open("GET", "data/authors/authors.xsl", true);
            xslRequest.onreadystatechange = function() {
                if (this.readyState === 4 && this.status === 200) {
                    var xsl = this.responseXML;

                    // Transformation XSLT
                    if (window.XSLTProcessor) { // Chrome, Firefox
                        var xsltProcessor = new XSLTProcessor();
                        xsltProcessor.importStylesheet(xsl);
                        var resultDocument = xsltProcessor.transformToFragment(xml, document);
                        document.getElementById("authorsDiv").appendChild(resultDocument);
                    } else if (window.ActiveXObject || "ActiveXObject" in window) { // IE
                        document.getElementById("authorsDiv").innerHTML = xml.transformNode(xsl);
                    }
                }
            };
            xslRequest.send();
        }
    };
    xhttp.send();
}

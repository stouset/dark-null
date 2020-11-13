import { default as forceCluster } from "./forceCluster.js"

Promise.all([
    d3.json('./data/universe.json'),
    d3.json('./data/routes.json'),
    d3.json('./data/diplo.json'),
]).then(([universe, routes, diplo]) => {
    const nodes = Object.entries(universe).reduce((list, [region, constellations]) => {
        return list.concat(Object.entries(constellations).reduce((list, [constellation, systems]) => {
            return list.concat(Object.entries(systems).reduce((list, [system, attributes]) => {
                list.push({
                    "id":            system,
                    "constellation": constellation,
                    "region":        region,
                    ...attributes,
                });

                return list;
            }, []));
        }, []));
    }, []);

    const edges = Object.values(routes).reduce((list, regions) => {
        return list.concat(Object.values(regions).reduce((list, links) => {
            return list.concat(links.map(link => {
                return { "source": link[0], "target": link[1] }
            }))
        }, []))
    }, []);

    const graph = {
        "nodes": nodes,
        "edges": edges,
    };

    const svg    = d3.select("svg");
    const width  = svg.attr("width");
    const height = svg.attr("height");

    var edge = svg
        .append("g")
            .attr("class", "edge")
        .selectAll("line")
        .data(graph.edges)
        .enter().append("line");

    var node = svg.append("g")
        .attr("class", "node")
        .selectAll("g")
        .data(graph.nodes)
        .enter()
        .append("g");
        // .attr("class", d => "diplo-" + (diplo.get(d.corp || "") || "neutral"));

    node.append("rect")
        .attr("x", -50)
        .attr("y", -20)
        .attr("width", 120)
        .attr("height", 40)
        .append("title").text(d => d.id);

    var text = node.append("text")
        .attr("text-anchor", "middle");

    text.append("tspan").attr("x", -15).attr("y", -2).text(d => d.id);
    text.append("tspan").attr("x", -15).attr("dy", 15).text(d => d.constellation);
    text.append("tspan").attr("x", 40).attr("y", -2).text(d => d.sec);
    text.append("tspan").attr("x", 40).attr("dy", 15).text(d => d.corp);

    const simulation = d3.forceSimulation(graph.nodes)
        .force("center",  d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide(60))
        .force("charge",  d3.forceManyBody().strength(-1000))
        .force("cluster", forceCluster().clusterBy(d => d.constellation))
        .force("cluster", forceCluster().clusterBy(d => d.region))
        .force("links",   d3.forceLink(graph.edges).id(d => d.id));

    simulation.on("tick", () => {
        edge
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    });
});

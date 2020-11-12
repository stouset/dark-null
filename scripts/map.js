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

    const forceLinkRegions = d3.forceLink(graph.edges)
        .id(d => d.id)
        .strength(0.9)
        .iterations(5)
        .distance(l => {
            switch (true) {
                case l.source.constellation === l.target.constellation: return 0;
                case l.source.region        === l.target.region:        return 500;
                default:                                                return 3000;
            };
        });

    const forceLinkConstellations = d3.forceLink(graph.edges)
        .id(d => d.id)
        .strength(0.85)
        .distance(l => l.source.constellation === l.target.constellation ? 5 : null);

    const forceLinkSystems = d3.forceLink(graph.edges)
        .id(d => d.id)
        .strength(0.5)
        .distance(25)

    const simulation = d3.forceSimulation(graph.nodes)
        .force("center",             d3.forceCenter(width / 2, height / 2))
        .force("linkRegions",        forceLinkRegions)
        .force("linkConstellations", forceLinkConstellations)
        .force("linkSystems",        forceLinkSystems)
        .force("collide",            d3.forceCollide(60))
        .force("charge1",            d3.forceManyBody().strength(-1000).distanceMin(1000).distanceMax(5000))
        .force("charge2",            d3.forceManyBody().strength(-200).distanceMin(200).distanceMax(1000))

    simulation.on("tick", () => {
        edge
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    });
});

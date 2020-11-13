export default function() {
    function index(d) {
        return d.index;
    }

    var nodes,
        random,
        clusters,
        clusterBy = index;

    function force(alpha) {
        for (const [cluster, nodes] of clusters) {
            const x = [...nodes].reduce((a, b) => a + b.x, 0) / nodes.size;
            const y = [...nodes].reduce((a, b) => a + b.y, 0) / nodes.size;

            for (const node of nodes) {
                const distance = Math.sqrt(
                    Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)
                );

                node.vx -= (node.x - x) * alpha;
                node.vy -= (node.y - y) * alpha;
            }
        }
    }

    function initialize() {
        if (!nodes || !clusterBy) {
            return;
        }

        clusters = new Map();

        for (let i = 0; i < nodes.length; ++i) {
            let node      = nodes[i];
            let clusterId = clusterBy(node);

            let cluster = clusters.get(clusterId);

            if (!cluster) {
                cluster = new Set();
                clusters.set(clusterId, cluster);
            }

            cluster.add(node);
        }
    }

    force.initialize = function(_nodes, _random) {
        nodes  = _nodes;
        random = _random;

        initialize();
    };

    force.clusterBy = function(_) {
        return arguments.length ? (clusterBy = _, initialize(), force) : clusterBy;
    }

    return force;
}

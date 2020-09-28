function TabMap($el, data, config) {
    this.$el = $el;
    this.data = data
    this.width = $el.width();
    this.height = $el.height();
    this.config = config;

    this.initTreemap();
}

Object.assign(TabMap.prototype, {
    DOM: {
        ct: 0,
        uid: function(id) {
            this.ct++;
            return { id: `${id}-${this.ct}`}
        }
    },

    initTreemap: function() {
        const me = this;
        this.treemap = dat => d3.treemap()
            .size([this.width, this.height])
            .paddingOuter(2)
            .paddingTop(d => {
                return (d.data.children.length > 1 || d.depth < 1) ? 10 : 2
            })
            .paddingInner(2)
            .round(true)
            (d3.hierarchy(dat)
                .sum(d => d.value)
                .sort((a, b) => b.value - a.value));

        this.format = d3.format(",d");

        this.color = (node) => {
            if (node.depth == 0)
                return "rgb(255, 255, 255)";

            //const highlight = (n) => (n.data.value > 1);
            if (node.data.selected) {
                console.log(node);
            }
            if (node.data.value > 5) {
                me.select(node);
            }
            //const isHighlighted = node.selected;//highlight && highlight(node);

            const path = node.ancestors().reverse().map(d => d.data.name).slice(1);
            const host = node.height === 0 ? new URL(node.data.name).hostname : node.data.name.split("/")[0];

            const colorCode = this.colorCodeHost(host);
            let interpolation = d3.scaleSequential([0, 1000], d3.interpolateCool)(colorCode);
            // const cl1 = path[0].toUpperCase().charCodeAt(0);
            // const cl2 = path.length > 1 ? path[1].toUpperCase().charCodeAt(0) : 48;
            // const colorCode = cl1 + cl2 / 2;
            // return d3.color(d3.scaleSequential([72, 135], d3.interpolateWarm)(colorCode)).darker((node.height-1));

            if (node.data.selected === true) {
                interpolation = d3.scaleSequential([5, -5], d3.interpolateRdYlGn)(node.data.value);
            }

            const c = d3.color(interpolation).darker(node.height-1);
            const hsl = d3.hsl(c);
            if (node.data.selected !== true)
                hsl.s = 0; //hsl.s * .8 ** (node.height + 1);
            return hsl;
        };
    },

    select: function(node) {
        node.data.selected = true;
        console.log("Select", node);
    },

    colorize: function(node) {

    },

    colorCodeHost: function(hostname) {
        let code = 0;

        if (hostname === "")
            return code;

        let hostparts = hostname.split(".").reverse();

        if (hostparts.length > 1)
            hostparts.shift();

        const anchor = hostparts.shift().toUpperCase();

        for (let i = 0; i < 3; i++) {
            code += Math.abs(Math.round(9 * (anchor.charCodeAt(i % anchor.length) - 65) / 25) * 10 ** (2 - i));
        }

        return code;
    },

    render: function() {
        this.$el.append(this.generate());
    },

    generate: function() {
        const me = this;
        //const data = this.data;
        const width = this.width;
        const height = this.height;
        //
        // const format = this.format;
        // const color = this.color;

        console.log("treedat", this.data);
        this.root = this.treemap(this.data);
        this.svg = d3.create("svg")
            .attr("viewBox", [0, 0, width, height])
            .style("overflow", "visible")
            .style("font", "10px sans-serif");

        this.update();

        return this.svg.node();
    },

    update: function() {
        const { DOM, svg, config, root, color, format } = this;
        const me = this;

        if (true) {
            this.svg
                .selectAll("rect")
                //.data(this.root.leaves())
                .data(this.root.descendants())
                .join("rect")
                    .attr('x', function (d) { return d.x0; })
                    .attr('y', function (d) { return d.y0; })
                    .attr('width', function (d) { return d.x1 - d.x0; })
                    .attr('height', function (d) { return d.y1 - d.y0; })
                    .attr("fill", function(d) { return color(d)} )
                    .on("mouseover", d => { config.onMouseOver(d) })
                    .on("mouseout", d => { config.onMouseOut(d) })
                    .on("mousedown", d => { me.select(d); me.update(); });

            return;
        }

        //const shadow = DOM.uid("shadow");

        // svg.append("filter")
        //     .attr("id", shadow.id)
        //     .append("feDropShadow")
        //     .attr("flood-opacity", 0.3)
        //     .attr("dx", 0)
        //     .attr("stdDeviation", 3 );

        const rectNode = svg.selectAll("g")
            .data(d3.nest().key(d => d.height).entries(root.descendants()))
            .join("g")
            .attr("class", "family")
            //.attr("filter", shadow)
            .selectAll("g")
            .data(d => d.values)
            .join(
                function(enter) {
                    return enter
                        .append('g')
                        .attr("class", "self")
                        .attr("transform", d => `translate(${d.x0},${d.y0})`);
                }
            );
            //.join("g")
            //.attr("transform", d => `translate(${d.x0},${d.y0})`);

        // rectNode.append("title")
        //     .text(d => `${d.ancestors().reverse().map(d => d.data.name).join("/")}\n${format(d.value)}`);

        // svg
        //     .selectAll("rect")
        //     .data(d3.nest().key(d => d.height).entries(root.descendants()))
        //     .enter()
        //     .append("rect")
        rectNode.append("rect")
            // .attr("id", d => (d.nodeUid = DOM.uid("node")).id)
            .attr("fill", d => color(d))
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .on("mouseover", d => { config.onMouseOver(d) })
            .on("mouseout", d => { config.onMouseOut(d) })
            .on("mousedown", d => { me.select(d); me.update(); });

        // rectNode.append("clipPath")
        //     .attr("id", d => (d.clipUid = DOM.uid("clip")).id)
        //     .append("use")
        //     .attr("xlink:href", d => d.nodeUid.href);

        // svg
        //     .selectAll("rect")
        //     .data(root.leaves())
        //     .enter()
        //     .attr("fill", d => color(d));

        // node.append("text")
        //     .attr("clip-path", d => d.clipUid)
        //     .selectAll("tspan")
        //     .data(d => {
        //         return "*";
        //         //return d.data.name.split(/(?=[A-Z][^A-Z])/g).concat(format(d.value))
        //     })
        //     .join("tspan")
        //     .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
        //     .text(d => d);

        // node.filter(d => d.children).selectAll("tspan")
        //     .attr("dx", 3)
        //     .attr("y", 13);
        //
        // node.filter(d => !d.children).selectAll("tspan")
        //     .attr("x", 3)
        //     .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`);

        console.log("TWO", this.data);
    }
});
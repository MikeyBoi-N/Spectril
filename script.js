const navSlide = () => {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav-links-mobile');

    hamburger.addEventListener('click', () => {
        nav.classList.toggle('active');
        hamburger.classList.toggle('toggle');
    });
}

navSlide();

document.addEventListener('DOMContentLoaded', () => {
    const typewriterElement = document.getElementById('typewriter');
    const text = "BRINGING TECH TO OUR WATERS";
    let index = 0;

    function type() {
        if (index < text.length) {
            typewriterElement.textContent += text.charAt(index);
            index++;
            setTimeout(type, 120);
        }
    }

    type();

    const sections = document.querySelectorAll('.technology-section');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        observer.observe(section);
    });
const sponsorCarousel = document.querySelector('.sponsor-carousel');

if (sponsorCarousel) {
    let width = sponsorCarousel.clientWidth;
    let height = sponsorCarousel.clientHeight;

    const svg = d3.select(sponsorCarousel).append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`);

    const maxAmount = Math.max(...sponsors.map(s => s.amount));
    const minRadius = 0.5 * 16; // 0.5rem in pixels
    const maxRadius = 8 * 16;   // 8rem in pixels

    const radiusScale = d3.scaleSqrt()
        .domain([0, maxAmount])
        .range([minRadius, maxRadius]);

    const nodes = sponsors.map(d => ({
        id: d.name,
        radius: radiusScale(d.amount),
        image: d.image,
        ...d
    }));

    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(5))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(d => d.radius + 2))
        .on("tick", ticked);

    const node = svg.selectAll(".sponsor-node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "sponsor-node")
        .call(drag(simulation));

    node.append("circle")
        .attr("r", d => d.radius)
        .style("fill", "white");

    node.append("image")
        .attr("xlink:href", d => d.image)
        .attr("x", d => -d.radius)
        .attr("y", d => -d.radius)
        .attr("height", d => d.radius * 2)
        .attr("width", d => d.radius * 2)
        .attr("clip-path", d => `circle(${d.radius}px at center)`);

    const text = node.append("text")
        .text(d => d.name)
        .attr("text-anchor", "middle")
        .attr("dy", d => d.radius + 15)
        .style("fill", "white")
        .style("opacity", 0)
        .style("transition", "opacity 0.3s");

    let hoverTimeout;
    node.on("mouseover", function(event, d) {
        hoverTimeout = setTimeout(() => {
            d3.select(this).select("text").style("opacity", 1);
        }, 1000);
    });

    node.on("mouseout", function(event, d) {
        clearTimeout(hoverTimeout);
        d3.select(this).select("text").style("opacity", 0);
    });

    function ticked() {
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    }

    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    function handleResize() {
        width = sponsorCarousel.clientWidth;
        height = sponsorCarousel.clientHeight;
        svg.attr("viewBox", `0 0 ${width} ${height}`);
        simulation.force("center", d3.forceCenter(width / 2, height / 2));
        simulation.alpha(0.3).restart();
    }

    window.addEventListener('resize', handleResize);
}
});
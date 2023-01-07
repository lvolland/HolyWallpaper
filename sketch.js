function darken(c, amount) {
    return color(
        c.levels[0] * amount,
        c.levels[1] * amount,
        c.levels[2] * amount,
        c.levels[3]
    );
}

function saveToPng() {
    saveCanvas(c, "canvas", "png");
}

function setup() {
    c_completed = color("#00BABC");
    c_inprogress = color("#FFFFFF");
    c_notstarted = color("#9D9EA0");
    let c = createCanvas(1920, 1080);
    draw();
    noLoop();
    // create a button to save the canvas
    let button = createButton("Save");
    button.mousePressed(saveToPng);
}

// Place evenly spaced points around a center point
function getPositions(center, count, parentRadius) {
    // calculate the angle between each circle
    let angle = 360 / count;
    let offset;
    if (count == 2)
        offset = 0;
    else
        offset = -90;
    output = [];

    // loop through the points
    for (let i = 0; i < count; i++) {
        // calculate the x and y position of the point
        const x = center.x + parentRadius * cos(angle * i + offset);
        const y = center.y + parentRadius * sin(angle * i + offset);
        output.push({ x: x, y: y });
    }
    return output;
}

function drawCircle(index, features, center) {
    noFill();
    strokeWeight(4);
    stroke(getCircleColor(features));
    // Draw the circle ring
    if (index != 0)
        ellipse(center.x, center.y, (height / 7) * index, (height / 7) * index);
    // Calculate the positions of the features
    let pos = getPositions({x: center.x, y: center.y}, features.length, (height / 7) * index / 2);
    for (let i = 0; i < features.length; i++) {
        let f = features[i];
        if (f.type === "ellipse") {
            // fill from f.fill with a darker outline
            fill(darken(f.fill, 0.8));
            strokeWeight(2);
            stroke(f.fill);
            ellipse(pos[i].x, pos[i].y, f.radius, f.radius);
        } else if (f.type === "circle") {
            // call recursively for every feature in f.config
            for (let c of Object.keys(f.config)) {
                drawCircle(c, f.config[c], pos[i]);
            }
        }
    }
}

function getCircleColor(list) {
    // if all are complete return c_completed
    // if one is in progress return c_inprogress
    // else return c_notstarted
    if (list.every((x) => x.fill == c_completed)) return c_completed;
    if (list.some((x) => x.fill == c_inprogress)) return c_inprogress;
    return c_notstarted;
}

function getConfig() {
    let p_complete = { type: "ellipse", radius: 40, fill: c_completed };
    let p_inprogress = { type: "ellipse", radius: 40, fill: c_inprogress };
    let p_notstarted = { type: "ellipse", radius: 40, fill: c_notstarted };
    let cpp = { type: "ellipse", radius: 15, fill: c_notstarted } ;
    
    return {
        0: [p_complete],
        1: [p_complete, p_complete, p_complete],
        2: [p_complete, p_complete, p_complete],
        3: [p_inprogress, p_inprogress],
        4: [p_notstarted, p_notstarted, { type: "circle", config: {0: [p_notstarted], 0.5: [cpp, cpp, cpp, cpp, cpp, cpp, cpp, cpp]} }],
        5: [p_notstarted, p_notstarted, p_notstarted],
        6: [{ type: "ellipse", radius: 60, fill: c_notstarted }],
    };
}

function drawGradient() {
    noFill();
    for (let y = height; y > 0; y--) {
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(color("#002534"), color("#090a0f"), inter);
        stroke(c);
        line(0, y, width, y);
    }
}

function draw() {
    drawGradient();
    // use cos and sin in degrees
    angleMode(DEGREES);

    let config = getConfig();
    for (let i = 0; i < 7; i++) {
        drawCircle(i, config[i], { x: width / 2, y: height / 2 });
    }
}

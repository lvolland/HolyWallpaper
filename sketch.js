import p5 from 'node-p5';
import {setWallpaper} from 'wallpaper';

let resourcesToPreload = {
    example: p5.loadJSON('example.json')
}

function sketch(p, preloaded) {
    let c_completed = p.color("#00BABC");
    let c_inprogress = p.color("#FFFFFF");
    let c_notstarted = p.color("#9D9EA0");
    let c_failed = p.color("#CC6256");
    p.parsedData = null;

    function darken(c, amount) {
        return p.color(
            c.levels[0] * amount,
            c.levels[1] * amount,
            c.levels[2] * amount,
            c.levels[3]
        );
    }
    
    p.setup = () => {
        let c = p.createCanvas(1920, 1080);
        p.parsedData = parseJson();
        p.noLoop();
        p.draw();
        p.saveCanvas(c, "wallpaper", "png").then(() => {
            console.log("Saved");
            setWallpaper("./wallpaper.png");
        });
    }
    p.draw = () => {
        drawGradient();
        // use cos and sin in degrees
        p.angleMode(p.DEGREES);

        let config = getConfig();
        for (let i = 0; i < 7; i++) {
            drawCircle(i, config[i], { x: p.width / 2, y: p.height / 2 });
        }
    }

    // Place evenly spaced points around a center point
    function getPositions(center, count, parentRadius) {
        // calculate the angle between each circle
        let angle = 360 / count;
        let offset;
        // if (parentRadius == 3)
        //     offset = 0;
        // else
            offset = -90;
        let output = [];

        // loop through the points
        for (let i = 0; i < count; i++) {
            // calculate the x and y position of the point
            const x = center.x + parentRadius * p.cos(angle * i + offset);
            const y = center.y + parentRadius * p.sin(angle * i + offset);
            output.push({ x: x, y: y });
        }
        return output;
    }

    function drawCircle(index, features, center) {
        p.noFill();
        p.strokeWeight(4);
        p.stroke(getCircleColor(features));
        // Draw the circle ring
        if (index != 0)
            p.ellipse(center.x, center.y, (p.height / 7) * index, (p.height / 7) * index);
        // Calculate the positions of the features
        let pos = getPositions({x: center.x, y: center.y}, features.length, (p.height / 7) * index / 2);
        for (let i = 0; i < features.length; i++) {
            let f = features[i];
            if (typeof f === "string" || Array.isArray(f))
                f = getHolyData(f);
            if (f.type === "ellipse") {
                // fill from f.fill with a darker outline
                p.fill(f.fill);
                p.strokeWeight(2);
                p.stroke(f.outline);
                p.ellipse(pos[i].x, pos[i].y, f.radius, f.radius);
                // draw a text that fits in the ellipse
                p.fill("#FFFFFF");
                p.noStroke();
                p.textSize(f.radius / 8);
                p.textAlign(p.CENTER, p.CENTER);
                p.text(f.name, pos[i].x - f.radius / 2, pos[i].y - f.radius / 2, f.radius, f.radius);
            } else if (f.type === "rectangle") {
                // fill from f.fill with a darker outline
                p.fill(f.fill);
                p.strokeWeight(2);
                p.stroke(f.outline);
                p.rect(pos[i].x - f.width / 2, pos[i].y - f.height / 2, f.width, f.height, f.radius);
                // draw a text that fits in the rectangle
                p.fill("#FFFFFF");
                p.noStroke();
                p.textSize(10);
                p.textAlign(p.CENTER, p.CENTER);
                p.text(f.name, pos[i].x - f.width / 2, pos[i].y - f.height / 2, f.width, f.height);
            } else if (f.type === "circle") {
                // call recursively for every feature in f.config
                for (let c of Object.keys(f.config)) {
                    drawCircle(c, f.config[c], pos[i]);
                }
            }
        }
    }

    function parseJson() {
        // get the json by sending a request to 'https://projects.intra.42.fr/project_data.json'
        // json = (await fetch('https://projects.intra.42.fr/project_data.json')).json();
        // let data = JSON.parse(json);
        // DO NOT WORK BECAUSE OF CORS AND AUTHENTICATION, SO I'LL JUST USE A LOCAL FILE FOR NOW

        let data = preloaded.example;
        let output = {};
        for (let i = 0; i < data.length; i++) {
            if (!data[i].rules.includes('You must not have validated any of quests common-core')) continue;
            output[data[i].slug] = data[i];
        }
        return output;
    }

    function getHolyData(input) {
        let outline = c_notstarted;
        let fill = null;
        let radius = 40;
        if (typeof input === "string") {
            let entry = p.parsedData[input];
            if (entry.state == "done")
                outline = c_completed;
            else if (entry.state == "in_progress")
            {
                outline = c_inprogress;
                fill = p.color("#46464c");
            }
            else if (entry.state == "failed")
                outline = c_failed;
            if (entry.slug == "ft_transcendence")
                radius = 80;
            else if (entry.slug.startsWith("cpp-module-0") && entry.slug != "cpp-module-08")
                radius = 20;
            fill = fill ?? darken(outline, 0.8);
            if (entry.slug.startsWith("exam-rank-"))
                return { type: "rectangle", height: 40, width: 80, outline: outline, fill: fill, radius: 10, name: entry.name };
            return { type: "ellipse", radius: radius, outline: outline, fill: fill, name: entry.name };
        } else if (Array.isArray(input)) {
            // for each of the children, if one is done, return it
            // else if one is in progress, return it
            // else return the first one
            for (let i = 0; i < input.length; i++) {
                if (p.parsedData[input[i]].state == "done")
                    return getHolyData(input[i]);
                else if (p.parsedData[input[i]].state == "in_progress")
                    return getHolyData(input[i]);
            }
            return getHolyData(input[0]);
        } else if ((input.type === "circle")) {
            return getHolyData(input.config[0][0]);
        }
    }

    function getCircleColor(list) {
        // if all are complete return c_completed
        // if one is in progress return c_inprogress
        // else return c_notstarted
        if (list.every((x) => getHolyData(x).outline == c_completed)) return c_completed;
        if (list.some((x) => getHolyData(x).outline == c_inprogress)) return c_inprogress;
        return c_notstarted;
    }

    function getConfig() {
        return {
            0: ["42cursus-libft"],
            1: ["42cursus-ft_printf", "42cursus-get_next_line", "born2beroot"],
            2: ["42cursus-push_swap", ["pipex", "minitalk"], "exam-rank-02", ["42cursus-fdf", "42cursus-fract-ol", "so_long"]],
            3: ["exam-rank-03", "42cursus-philosophers", "42cursus-minishell"],
            4: [["cub3d", "minirt"], "netpractice", "exam-rank-04", { type: "circle", config: {0: ["cpp-module-08"], 0.5: ["cpp-module-00", "cpp-module-01", "cpp-module-02", "cpp-module-03", "cpp-module-04", "cpp-module-05", "cpp-module-06", "cpp-module-07"]} }],
            5: ["exam-rank-05", ["webserv", "ft_irc"], "ft_containers", "inception"],
            6: ["ft_transcendence", "exam-rank-06"],
        };
    }

    function drawGradient() {
        p.background("#090a0f");
        p.noFill();
        for (let y = p.height; y > 0; y--) {
            let inter = p.map(y, 0, p.height, 0, 1);
            let c = p.lerpColor(p.color("#002534"), p.color("#090a0f"), inter);
            p.stroke(c);
            p.line(0, y, p.width, y);
        }
    }
}

let p5Instance = p5.createSketch(sketch, resourcesToPreload);
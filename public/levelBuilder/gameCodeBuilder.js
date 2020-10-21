
const RED_HEX = "#FF0000"
const RED_RGB = webglUtils.hexToRgb(RED_HEX)
const RECTANGLE = "RECTANGLE"
const TRIANGLE = "TRIANGLE"
const CIRCLE = "CIRCLE"
const STAR = "STAR"
const BLUE_RGB = webglUtils.hexToRgb("#0000FF")
const GREEN_RGB = webglUtils.hexToRgb("#00FF00")
const CIRCLE_RESOLUTION = 100
const origin = { x: 0, y: 0 }
const sizeOne = { width: 1, height: 1 }
const GREY_RGB = webglUtils.hexToRgb("#808080")
const ICE_RGB = webglUtils.hexToRgb("#ADD8E6")
const BLUE_GOAL = webglUtils.hexToRgb("#3399FF")
const RED_GOAL = webglUtils.hexToRgb("#FF6666")
const GREEN_GOAL = webglUtils.hexToRgb("#99FF99")
let shapes = [

]

let spriteColors = [BLUE_RGB, RED_RGB, GREEN_RGB]
let spriteGoalColors = [BLUE_GOAL, RED_GOAL, GREEN_GOAL]

let origSprites
let ices
let walls
let goals
let spriteIndeces = []



const addShape = (translation, color) => {
    if (translation) {
        tx = translation.x
        ty = translation.y
    }
    if (color) {
        rgb = color
    } else {
        rgb = GREY_RGB
    }
    const shape = {
        type: RECTANGLE,
        position: origin,
        dimensions: sizeOne,
        color: rgb,
        translation: { x: tx, y: ty, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 50, y: 50, z: 20 }
    }
    shapes.push(shape)
    render()
}


let gl
let attributeCoords
let uniformMatrix
let uniformColor
let bufferCoords

const doMouseDown = (event) => {
    const boundingRectangle = canvas.getBoundingClientRect()
    const x = event.clientX - boundingRectangle.left
    const y = event.clientY - boundingRectangle.top

    const shapeType = document.querySelector("input[name='shape']:checked").value
    const translation = { x: roundNearestPoint(x), y: roundNearestPoint(y) }
    let color
    if (shapeType === "Wall") {
        color = GREY_RGB
        walls.push(translation)
    } else if (shapeType === "Sprite") {
        if (origSprites.length < 3) {
            color = spriteColors[origSprites.length]
            spriteIndeces.push(shapes.length)
            origSprites.push({ translation: translation, color: color })
        }
        else {
            alert("too many sprites")
            return
        }
    } else if (shapeType === "Goal") {
        if (goals.length < 3) {
            color = spriteGoalColors[goals.length]
            goals.push({ translation: translation, color: color })
        }
        else {
            alert("too many goals")
            return
        }
    }
    else if (shapeType === "Ice") {
        color = ICE_RGB
        ices.push(translation)
    }
    addShape(translation, color);
}

const roundNearestPoint = (num) => {
    let c = Math.ceil(num / 25);
    let f = Math.floor(num / 25);
    if (c % 2 == 1) {
        return c * 25;
    }
    else {
        return f * 25;
    }
}

const doKeyEvent = (event) => {
    if (event.code === "KeyW") {
        move(0, -50);
    } else if (event.code === "KeyA") {
        move(-50, 0);
    } else if (event.code === "KeyS") {
        move(0, 50);
    } else if (event.code === "KeyD") {
        move(50, 0);
    } else if (event.code === "KeyR") {
        resetBoard();
    }
    render()
}

const move = (deltax, deltay) => {
    let newSprites = []
    for (i = 0; i < spriteIndeces.length; i++) {
        let newShape = {
            index: spriteIndeces[i],
            translation: { x: shapes[spriteIndeces[i]].translation.x + deltax, y: shapes[spriteIndeces[i]].translation.y + deltay }
        }
        newSprites.push(newShape)
    }
    let spritesThatStayed = []
    for (let i = 0; i < newSprites.length; i++) {
        if (ices.some((ice) => ice.x === newSprites[i].translation.x && ice.y === newSprites[i].translation.y)) {
            newSprites[i].translation.x += deltax;
            newSprites[i].translation.y += deltay;
        }
        if (outOfBounds(newSprites[i]) ||
            walls.some((wall) => (wall.x === newSprites[i].translation.x && wall.y === newSprites[i].translation.y))) {
            newSprites[i].translation.x -= deltax;
            newSprites[i].translation.y -= deltay;
            spritesThatStayed.push(newSprites[i])
        }
    }
    newSprites = newSprites.filter(sp => !spritesThatStayed.includes(sp))
    let done = false
    while (!done) {
        done = true;
        for (let i = 0; i < newSprites.length; i++) {
            if (spritesThatStayed.some(sts => (sts.translation.x === newSprites[i].translation.x && sts.translation.y === newSprites[i].translation.y))) {
                newSprites[i].translation.x -= deltax;
                newSprites[i].translation.y -= deltay;
                spritesThatStayed.push(newSprites[i])
                done = false;
            }
        }
        newSprites = newSprites.filter(sp => !spritesThatStayed.includes(sp))
    }
    newSprites.forEach(sp => shapes[sp.index].translation = sp.translation)
    if (checkWin()) {
        alert("good job!")
    }
}

const resetBoard = () => {
    shapes = []
    walls.forEach((wallLocation) =>
        addShape(wallLocation, GREY_RGB))
    goals.forEach((goal) => addShape(goal.translation, goal.color))
    origSprites.forEach((sprite) => {
        spriteIndeces.push(shapes.length)
        addShape(sprite.translation, sprite.color)
    })

    ices.forEach((iceLocation) => addShape(iceLocation, ICE_RGB))
}

const checkWin = () => {
    let w = true;
    for (let i = 0; i < spriteIndeces.length; i++) {
        w = w && shapes[spriteIndeces[i]].translation.x === goals[i].translation.x && shapes[spriteIndeces[i]].translation.y === goals[i].translation.y
    }
    return w
}

const outOfBounds = (sprite) => (sprite.translation.x < 0) || (sprite.translation.y < 0) || (sprite.translation.x > 500) || (sprite.translation.y > 500);

const init = () => {

    const canvas = document.querySelector("#canvas");
    gl = canvas.getContext("webgl");

    canvas.addEventListener(
        "mousedown",
        doMouseDown,
        false);

    document.addEventListener("keypress", doKeyEvent, false);

    const program = webglUtils.createProgramFromScripts(gl, "#vertex-shader-2d", "#fragment-shader-2d");
    gl.useProgram(program);

    // get reference to GLSL attributes and uniforms
    attributeCoords = gl.getAttribLocation(program, "a_coords");
    const uniformResolution = gl.getUniformLocation(program, "u_resolution");
    uniformColor = gl.getUniformLocation(program, "u_color");
    uniformMatrix = gl.getUniformLocation(program, "u_matrix");

    // initialize coordinate attribute
    gl.enableVertexAttribArray(attributeCoords);

    // initialize coordinate buffer
    bufferCoords = gl.createBuffer();

    // configure canvas resolution
    gl.uniform2f(uniformResolution, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    /*document.getElementById("tx").onchange = event => updateTranslation(event, "x")
    document.getElementById("ty").onchange = event => updateTranslation(event, "y")

    document.getElementById("sx").onchange = event => updateScale(event, "x")
    document.getElementById("sy").onchange = event => updateScale(event, "y")

    document.getElementById("rz").onchange = event => updateRotation(event, "z")*/

    //document.getElementById("color").onchange = event => updateColor(event)
    resetBoard()
}

const setupData = () => {
    walls = data.walls;
    walls.forEach((wall) => {
        wall.x = changeCoord(wall.x);
        wall.y = changeCoord(wall.y);
    })
    origSprites = data.origSprites
    ices = data.ices;
    ices.forEach((ice) => {
        ice.x = changeCoord(ice.x);
        ice.y = changeCoord(ice.y);
    })
    goals = data.goals
    goals.forEach((goal) => {
        if (goal.color === "blue") {
            goal.color = BLUE_GOAL
        }
        else if (goal.color === "red") {
            goal.color = RED_GOAL
        }
        else if (goal.color === "green") {
            goal.color = GREEN_GOAL
        } 
        goal.translation.x = changeCoord(goal.translation.x);
        goal.translation.y = changeCoord(goal.translation.y);
    })
    origSprites.forEach((sp) => {
        if (sp.color === "blue") {
            sp.color = BLUE_RGB
        }
        else if (sp.color === "red") {
            sp.color = RED_RGB
        }
        else if (sp.color === "green") {
            sp.color = GREEN_RGB
        }
        sp.translation.x = changeCoord(sp.translation.x);
        sp.translation.y = changeCoord(sp.translation.y);
    });

}


const spriteColorToGoalColor = (col) => {
    if (col === BLUE_RGB) {
        return BLUE_GOAL
    }
    else if (col === RED_RGB) {
        return RED_GOAL
    }
    else if (col === GREEN_RGB) {
        return GREEN_GOAL
    } else {
        return webglUtils.hexToRgb("#000000");
    }
} 
const changeCoord = (i) => 50 * i - 25;

let selectedShapeIndex = 0

const updateTranslation = (event, axis) => {
    const value = event.target.value
    shapes[selectedShapeIndex].translation[axis] = value
    render();
}

const updateScale = (event, axis) => {
    const value = event.target.value
    shapes[selectedShapeIndex].scale[axis] = value
    render();
}

const updateRotation = (event, axis) => {
    const value = event.target.value
    const angleInDegrees = (360 - value) * Math.PI / 180;
    shapes[selectedShapeIndex].rotation[axis] = angleInDegrees
    render();
}

const updateColor = (event) => {
    const value = event.target.value
    shapes[selectedShapeIndex].color = webglUtils.hexToRgb(value)
    render();
}


const render = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
    gl.vertexAttribPointer(
        attributeCoords,
        2,           // size = 2 components per iteration
        gl.FLOAT,    // type = gl.FLOAT; i.e., the data is 32bit floats
        false,       // normalize = false; i.e., don't normalize the data
        0,           // stride = 0; ==> move forward size * sizeof(type)
        // each iteration to get the next position
        0);          // offset = 0; i.e., start at the beginning of the buffer
    const $shapeList = $("#object-list")

    $shapeList.empty()
    //<button onclick="deleteShape(${index})">Delete</button>
    shapes.forEach((shape, index) => {
        const $li = $(`
     <li>
       <label>
         <input type="radio" id="${shape.type}-${index}" name="shape-index"  ${index === selectedShapeIndex ? "checked" : ""} onclick="selectShape(${index})" value="${index}"/>
         
         ${shape.type};
         X: ${shape.translation.x};
         Y: ${shape.translation.y}
       </label>
     </li>
   `)
        $shapeList.append($li)

        gl.uniform4f(uniformColor,
            shape.color.red,
            shape.color.green,
            shape.color.blue, 1);
        let matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
        matrix = m3.translate(matrix, shape.translation.x, shape.translation.y);
        matrix = m3.rotate(matrix, shape.rotation.z);
        matrix = m3.scale(matrix, shape.scale.x, shape.scale.y);

        gl.uniformMatrix3fv(uniformMatrix, false, matrix);
        if (shape.type === RECTANGLE) {
            renderRectangle(shape)
        }
    })
}


const renderRectangle = (rectangle) => {
    const x1 = rectangle.position.x
        - rectangle.dimensions.width / 2;
    const y1 = rectangle.position.y
        - rectangle.dimensions.height / 2;
    const x2 = rectangle.position.x
        + rectangle.dimensions.width / 2;
    const y2 = rectangle.position.y
        + rectangle.dimensions.height / 2;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1, x2, y1, x1, y2,
        x1, y2, x2, y1, x2, y2,
    ]), gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

const deleteShape = (shapeIndex) => {
    shapes.splice(shapeIndex, 1)
    render()
}

const selectShape = (shapeIndex) => {
    selectedShapeIndex = shapeIndex
    document.getElementById("tx").value = shapes[shapeIndex].translation.x
    document.getElementById("ty").value = shapes[shapeIndex].translation.y
    document.getElementById("sx").value = shapes[shapeIndex].scale.x
    document.getElementById("sy").value = shapes[shapeIndex].scale.y
    document.getElementById("rz").value = shapes[shapeIndex].rotation.z
    const hexColor = webglUtils.rgbToHex(shapes[shapeIndex].color)
    document.getElementById("color").value = hexColor
    render();
}

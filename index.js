import Controller from 'jigsawlutioner-controller';
import BrickPi from 'brickpi3';

const controller = new Controller(3000);

controller.createEndpoint('reset', async (parameters, resolve) => {
    const pushMotor = await controller.getMotor(parameters, 'pushMotor');
    const moveMotor = await controller.getMotor(parameters, 'moveMotor');
    const boxMotor = await controller.getMotor(parameters, 'boxMotor');

    await Promise.all([
        controller.resetMotor(pushMotor, BrickPi.utils.RESET_MOTOR_LIMIT.FORWARD_LIMIT, 30),
        controller.resetMotor(moveMotor, BrickPi.utils.RESET_MOTOR_LIMIT.FORWARD_LIMIT, 50),
        controller.resetMotor(boxMotor, BrickPi.utils.RESET_MOTOR_LIMIT.BACKWARD_LIMIT, 70),
    ]);
});

controller.createEndpoint('move-to-box', async (parameters, resolve) => {
    const pushMotor = await controller.getMotor(parameters, 'pushMotor');
    const moveMotor = await controller.getMotor(parameters, 'moveMotor');
    const boxMotor = await controller.getMotor(parameters, 'boxMotor');

    if (typeof parameters.box === 'undefined') {
        throw new Error('Parameter "box" was missing from the call.');
    }

    await Promise.all([
        movePieceToCliff(moveMotor, pushMotor, parameters.offset || 0),
        boxMotor.setPosition(getBoxPosition(parameters.box)),
    ]);

    resolve();

    await moveMotor.setPosition(-1300);

    await Promise.all([
        pushMotor.setPosition(-100),
        moveMotor.setPosition(-500),
    ]);

    await pushMotor.setPower(0);
    await moveMotor.setPower(0);
    await boxMotor.setPower(0);
});

controller.createEndpoint('select-box', async (parameters, resolve) => {
    const boxMotor = await controller.getMotor(parameters, 'boxMotor');

    if (typeof parameters.box === 'undefined') {
        throw new Error('Parameter "box" was missing from the call.');
    }

    await boxMotor.setPosition(getBoxPosition(parameters.box));
    await boxMotor.setPower(0);
});

function getBoxPosition(box) {
    const boxTeeths = 5 * 10; //https://www.brickowl.com/catalog/lego-gear-rack-4-3743
    const teethsPerRotation = 16; //https://www.brickowl.com/catalog/lego-gear-with-16-teeth-reinforced-94925
    const rotationPerBox = boxTeeths / teethsPerRotation * 360;
    const boxOffsetRotation = 10 / teethsPerRotation * 360;

    return box * rotationPerBox + boxOffsetRotation;
}

async function movePieceToCliff(moveMotor, pushMotor, offset) {
    const offsetToMiddle = 220;
    const cmPerTeeth = 3.2 / 10; //https://www.brickowl.com/catalog/lego-gear-rack-4-3743
    const cmPerRotation = cmPerTeeth * 20; //https://www.brickowl.com/catalog/lego-gear-with-20-teeth-and-double-bevel-unreinforced-32269

    let offsetInDegree = offsetToMiddle + 360 * offset * (14/*cm plate height*/ / 2) / cmPerRotation;

    if (offsetInDegree < 0) {
        offsetInDegree = 0;
    }

    await moveMotor.setPosition(-offsetInDegree);

    await pushMotor.setPosition(-200);

    await moveMotor.setPosition(-800);
}

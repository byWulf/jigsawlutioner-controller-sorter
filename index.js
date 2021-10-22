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
        controller.resetMotor(boxMotor, BrickPi.utils.RESET_MOTOR_LIMIT.FORWARD_LIMIT, 70),
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
        boxMotor.setPosition(parameters.box * -370)
    ]);

    resolve();

    await moveMotor.setPosition(-1300);

    await Promise.all([
        await pushMotor.setPosition(-100),
        await moveMotor.setPosition(-500),
    ])
});

async function movePieceToCliff(moveMotor, pushMotor, offset) {
    const offsetToMiddle = 270;
    const cmPerTeeth = 3.2 / 10; //https://www.brickowl.com/catalog/lego-gear-rack-4-3743
    const cmPerRotation = cmPerTeeth * 20; //https://www.brickowl.com/catalog/lego-gear-with-20-teeth-and-double-bevel-unreinforced-32269

    let offsetInDegree = offsetToMiddle + 360 * offset * (6/*cm plate height*/ / 2) / cmPerRotation;

    await moveMotor.setPosition(-offsetInDegree);

    await pushMotor.setPosition(-250);

    await moveMotor.setPosition(-1000);
}

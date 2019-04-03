import { Container, injectable, multiInject } from 'inversify';
import { assert } from 'chai';
import 'reflect-metadata';

const TypeSymbols = {
    IMessageHandler: Symbol.for("IMessageHandler"),
};

enum MessageType {
    foo = 'Foo',
    bar = 'Bar'
}

interface IMessageHandler {
    handle(): void;
    canHandle(messageType: MessageType): boolean;
}

@injectable()
class FooMessageHandler implements IMessageHandler {
    public handle(): void {
        console.log("FooMessageHandler handling message...");
    }

    public canHandle(messageType: MessageType) {
        return messageType === MessageType.foo;
    }
}

@injectable()
class BarMessageHandler implements IMessageHandler {
    public handle(): void {
        console.log("BarMessageHandler handling message...");
    }

    public canHandle(messageType: MessageType) {
        return messageType === MessageType.bar;
    }
}

@injectable()
class MessageHandlerFactory {
    constructor(
        @multiInject(TypeSymbols.IMessageHandler)
        private readonly candidates: IMessageHandler[]
        ) {}

    public create(messageType: MessageType) {
        const suitableCandidates = this.candidates.filter(handler => handler.canHandle(messageType));

        if (suitableCandidates.length === 0) {
            throw new Error(`Could not find a suitable candidate for handling messages of type '${messageType}'.`);
        } else if (suitableCandidates.length > 1) {
            throw new Error(`Too many suitable candidates found for handling messages of type '${messageType}'.`);
        }

        return suitableCandidates[0];
    }
}

describe("Factory", () => {
    it("should resolve handler by role interface hint", () => {
        // Arrange
        const container = new Container();
        container.bind<IMessageHandler>(TypeSymbols.IMessageHandler).to(FooMessageHandler).inTransientScope();
        container.bind<IMessageHandler>(TypeSymbols.IMessageHandler).to(BarMessageHandler).inTransientScope();
        container.bind(MessageHandlerFactory).toSelf().inTransientScope();

        // Act
        const handlerFactory = container.get(MessageHandlerFactory);
        const fooHandler = handlerFactory.create(MessageType.foo);
        const barHandler = handlerFactory.create(MessageType.bar);

        // Assert
        assert.instanceOf(fooHandler, FooMessageHandler);
        assert.instanceOf(barHandler, BarMessageHandler);
    });
});

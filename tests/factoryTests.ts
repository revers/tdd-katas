import { Container, injectable, inject, interfaces } from 'inversify';
import { assert } from 'chai';
import 'reflect-metadata';

const TypeSymbols = {
    MessageSenderFactory: Symbol.for("Factory<MessageSender>"),
};

@injectable()
class MessageSender {
    public send(): void {
        console.log("Sending message...");
    }
}

@injectable()
class MessageQueueRunner {
    constructor(
        @inject(TypeSymbols.MessageSenderFactory)
        private readonly messageSenderFactory: () => MessageSender
    ) { }

    public run(): MessageSender {
        const messageSender = this.messageSenderFactory();
        messageSender.send();

        return messageSender;
    }
}

describe("Factory", () => {
    it("should resolve new senders for transient scope", () => {
        // Arrange
        const container = new Container();
        container.bind(MessageQueueRunner).toSelf().inSingletonScope();
        container.bind(MessageSender).toSelf().inTransientScope();
        container.bind<interfaces.Factory<MessageSender>>(TypeSymbols.MessageSenderFactory)
            .toFactory<MessageSender>((context: interfaces.Context) => {
                return () => {
                    return context.container.get(MessageSender);
                };
            });

        // Act
        const runner = container.get(MessageQueueRunner);
        const sender1 = runner.run();
        const sender2 = runner.run();

        // Assert
        assert.notStrictEqual(sender1, sender2);
    });

    it("should resolve same sender for singleton scope", () => {
        // Arrange
        const container = new Container();
        container.bind(MessageQueueRunner).toSelf().inSingletonScope();
        container.bind(MessageSender).toSelf().inSingletonScope();
        container.bind<interfaces.Factory<MessageSender>>(TypeSymbols.MessageSenderFactory)
            .toFactory<MessageSender>((context: interfaces.Context) => {
                return () => {
                    return context.container.get(MessageSender);
                };
            });

        // Act
        const runner = container.get(MessageQueueRunner);
        const sender1 = runner.run();
        const sender2 = runner.run();

        // Assert
        assert.strictEqual(sender1, sender2);
    });
});

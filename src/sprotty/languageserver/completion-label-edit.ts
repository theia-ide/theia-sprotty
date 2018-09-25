import { SLabel } from "sprotty/lib";
import { Ranged, toLsRange } from "./ranged";
import { inject, injectable } from "inversify";
import { TheiaDiagramServerProvider } from "../theia-diagram-server";
import { CompletionRequest, CompletionList, CompletionItem, TextEdit } from '@theia/languages/lib/browser';

@injectable()
export class CompletionLabelEditor {

    @inject(TheiaDiagramServerProvider) diagramServerProvider: TheiaDiagramServerProvider;

    async edit(element: SLabel & Ranged) {
        const range = toLsRange(element.range);
        const diagramServer = await this.diagramServerProvider();
        const connector = await diagramServer.getConnector();
        if (connector.quickPickService && connector.workspace) {
            const languageClient = await connector.getLanguageClient();
            const uri = diagramServer.getSourceUri();
            const completions = await languageClient.sendRequest(CompletionRequest.type, {
                textDocument: { uri: diagramServer.getSourceUri() },
                position: range.start
            })
            if (completions) {
                const completionItems = ((completions as any)["items"])
                    ? (completions as CompletionList).items
                    : completions as CompletionItem[]
                const quickPickItems = completionItems.map(i => { return {
                    label: i.textEdit!.newText,
                    value: i
                }});
                const pick = await connector.quickPickService.show(quickPickItems)
                if (pick && pick.textEdit) {
                    const changes: { [uri: string]: TextEdit[] } = {};
                    changes[uri] = [ {
                        ...pick.textEdit, ...{ range }
                    }];
                    await connector.workspace.applyEdit({
                        changes
                    })
                }
            }
        }
    }
}
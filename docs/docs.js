async function main() {
    const fs = require("fs/promises")
    const typedoc = require("typedoc")
    const { markdownTable } = await import("markdown-table")

    /**
     * @param {typedoc.DeclarationReflection} property 
     */
    function parseProperty(property) {
        let md = ""

        md += `### ${property.name}\n${property.comment?.shortText ?? property.getSignature?.comment?.shortText ?? ""}\n\n`
        let type = (property.type ?? property.getSignature.type)?.toString()

        if (type) md += `Type: \`${type}\`\n\n`

        return md
    }

    /**
     * @param {typedoc.DeclarationReflection} method 
     */
    function parseMethod(method) {
        let md = ""

        let url = method.sources?.length ? method.sources[0].url : undefined
        let inCode = url ? `[</>](${url})` : ""

        md += `### ${method.name}(${method.signatures[0].parameters.map(param => {
            return param.defaultValue ? `[${param.name}]` : param.name
        }).join(", ")}) ${inCode}\n${method.signatures[0].comment?.shortText ?? ""}\n\n`

        let paramTable = []

        method.signatures[0].parameters.forEach(param => {
            paramTable.push([param.name, `\`${param.type.toString().replace(/\|/g, " or ")}\``, param.defaultValue ? "✔" : "", param.defaultValue ?? "", param.comment?.shortText ?? ""])
        })

        if (method.signatures[0].parameters.length) {
            if (paramTable.every(p => !p[2])) {
                paramTable.forEach((p, i) => {
                    paramTable[i].splice(2, 2)
                })
                paramTable.unshift(["Parameter", "Type", "Description"])
            } else paramTable.unshift(["Parameter", "Type", "Optional", "Default", "Description"])
            md += markdownTable(paramTable) + "\n\n"
        }

        md += `Returns: \`${method.signatures[0].type.toString()}\`\n\n`

        let example = method.signatures[0].comment?.tags?.find(t => t.tagName === "example")?.text

        if (example) md += `**Example:**\n\`\`\`js\n${example.trim()}\n\`\`\`\n`

        return md
    }

    /**
     * @param {typedoc.DeclarationReflection} _class 
     */
    function parseClass(_class) {
        let md = ""

        // head
        md += `# class \`${_class.name}\`\n`

        if (_class.extendedTypes)
            md += `extends \`${_class.extendedTypes.map(t => t.name).join(", ")}\`\n\n`

        md += (_class.comment?.shortText ?? "No description") + "\n"

        // constructor
        let constructor = _class.children.find(c => c.kindString === "Constructor")

        if (constructor && constructor.signatures) {
            md += `## Constructor\n`

            let example = constructor.signatures[0].comment?.tags?.find(t => t.tagName === "example")?.text
            if (example) md += `\`\`\`js\n${example.trim()}\n\`\`\`\n`

            let params = []
            constructor.signatures[0].parameters.forEach(param => {
                params.push([
                    param.name,
                    param.type.name,
                    param.comment?.shortText.trim() ?? "No description"
                ])
            })
            md += markdownTable([
                ["Parameter", "Type", "Description"],
                ...params
            ])
            md += "\n\n"
        }

        // methods, properties & events
        let properties = [], methods = [], events = []

        let propertiesMd = "## **Properties:**\n", methodsMd = "## **Methods:**\n", eventsMd = "## **Events:**\n"

        _class.children.forEach(child => {
            switch (child.kindString) {
                case "Property":
                case "Accessor":
                    propertiesMd += parseProperty(child)
                    properties.push(child)
                    break

                case "Method":
                    methodsMd += parseMethod(child)
                    methods.push(child)
                    break

                default:
                    break
            }
        })

        md += "---\n\n"

        let table = [["Properties", "Methods", "Events"]]
        for (let i = 0; i < Math.max(properties.length, methods.length, events.length); i++) {
            const property = properties[i], method = methods[i], event = events[i]
            table.push([property?.name ?? "", method?.name ?? "", event?.name ?? ""])
        }

        md += markdownTable(table)
        md += "\n\n"

        md += propertiesMd + methodsMd + eventsMd

        return md
    }

    const app = new typedoc.Application()

    app.options.addReader(new typedoc.TSConfigReader())
    app.bootstrap({
        entryPoints: ["src/index.ts"],
        excludeExternals: true,
        excludePrivate: true
    })

    const project = app.convert()

    let finalMD = ""
    let classes = project.children.filter(c => c.kindString === "Class")

    for (const c of classes)
        finalMD += parseClass(c)

    console.log("--------------------------------")
    // console.log(finalMD)

    //await app.generateJson(project, __dirname + "/documentation.json")

    await fs.writeFile(__dirname + "/out.md", finalMD)
}

main().catch(console.error)

async function main() {
    const fs = require("fs/promises")
    const typedoc = require("typedoc")
    const { markdownTable } = await import("markdown-table")

    /**
     * @param {typedoc.DeclarationReflection} _class 
     */
    function parseClass(_class) {
        let md = ""

        md += `# class \`${_class.name}\`\n`

        if (_class.extendedTypes)
            md += `extends \`${_class.extendedTypes.map(t => t.name).join(", ")}\`\n`

        md += _class.comment?.shortText ?? ""

        let constructor = _class.children.find(c => c.kindString === "Constructor")

        if (constructor && constructor.signatures) {
            md += `## Constructor\n`
            let params = []
            constructor.signatures[0].parameters.forEach(param => {
                params.push([
                    param.name,
                    param.type.name,
                    param.comment?.shortText ?? "No description"
                ])
            })
            md += markdownTable([
                ["Parameter", "Type", "Description"],
                ...params
            ])
            md += "\n"
        }

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
    console.log(finalMD)

    // await app.generateJson(project, __dirname + "/documentation.json")
    await fs.writeFile(__dirname + "/out.md", finalMD)
}

main().catch(console.error)

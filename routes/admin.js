const express = require('express')
const router = express.Router();
const mongoose = require('mongoose');
require("../models/Categorias")
const Categoria = mongoose.model('Categorias');
require("../models/Postagens");
const Postagens = mongoose.model('Postagens');
const {eAdmin }= require("../helpers/eAdmin");
//Rota principal
router.get('/', (req, res) => {
    res.render("../views/admin/admin");
});
//Rota posts
router.get('/posts', eAdmin, (req, res) => {
    res.send("Pagina de posts");
});
//Rota categorias
router.get('/categorias',eAdmin, (req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render("admin/categorias", { categorias: categorias });
    }).catch((erro) => { //Tratamento do erro
        req.flash('error_msg', "Houve um erro ao registrar as categorias.");
        res.redirect("/admin");
    });

});
//Rota ADD categoria
router.get('/categorias/add', eAdmin, (req, res) => {
    res.render("admin/addcategorias");
});
router.post('/categorias/nova',eAdmin, (req, res) => {

    let erros = [];
    //Validação do envio do formulario, com os dados das categorias

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ text: "Nome invalido" });
    }
    if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
        erros.push({ text: "Slug invalido" })
    }
    if (erros.length > 0) {
        res.render("admin/addcategorias", { erros: erros })
    }


    else {
        const novaCategoria = {
            nome: req.body.nome,
            slug: req.body.slug,
            img: req.body.img
        }
        new Categoria(novaCategoria).save().then(() => {
            req.flash("success_msg", "Categoria criada com sucesso!");
            res.redirect("/admin/categorias")
        }).catch((erro) => {
            req.flash("error_msg", "Houve um erro ao salvar a categoria")
            res.redirect("/admin/categorias")
        })
    }
});
//Rota edição de categorias
router.get("/categorias/editar/:id",eAdmin, (req, res) => {
    //Pesquisando um registro que tenha um id = ao passado na rota
    Categoria.findOne({ _id: req.params.id }).lean().then((categoria) => {
        res.render("admin/editcategorias", { categoria: categoria });
    }).catch((erro) => {
        req.flash("error_msg", "Esta categoria não existe")
        res.redirect("/admin/categorias")
    })

});
//Aplicando a edição de categorias
router.post("/categorias/editar",eAdmin, (req, res) => {
    //Chamando o model, procurando um id que foi passado no form do front-end dentro do back-end 
    Categoria.findOne({ _id: req.body.id }).then((categoria) => {

        categoria.nome = req.body.nome; //Pegando o campo nome e atribuindo
        categoria.slug = req.body.slug;
        categoria.img = req.body.img;

        //Validação da edição

        let erros = [];

        if(!req.body.nome && typeof req.body.nome == undefined && req.body.slug == null){
            erros.push({text: 'Nome invalido'})
        }
        if(req.body.slug && typeof req.body.slug == undefined && req.body.slug == null){
            erros.push({text: 'Slug invalido'})
        }
        if(req.body.img && typeof req.body.img == undefined && req.body.img == null){
            erros.push({text: 'Link invalido'})
        }else{
            categoria.save().then(() => {
                req.flash("success_msg", "Categoria editada com sucesso");
                res.redirect("/admin/categorias");
    
            }).catch((erro) => {
                req.flash("error_msg", "Houve um erro interno ao salvar a edição categoria" + erros);
                res.redirect("/admin/categorias");
                console.log(erro);
            })
        }
    }).catch((erro) => {
        req.flash("error_msg", "Houve um erro ao editar a categoria")
        res.redirect("/admin/categorias");
        console.log(erro);
    })
})

//Rota Deletar Categorias

router.post("/categorias/deletar",eAdmin, (req, res) => {
    Categoria.deleteOne({ _id: req.body.id }).then(() => {
        req.flash("succes_msg", "Categoria deletada com sucesso")
        res.redirect("/admin/categorias")
    }).catch(() => {
        req.flash("error_msg", "Houve um erro ao deletar a categoria")
        res.redirect("/admin/categorias")
    })


})

//Rota de postagens

router.get("/postagens",eAdmin, (req, res) => {

    Postagens.find().lean().populate({ path: "categoria", strictPopulate: false }).sort({ data: "desc" }).then((postagens) => {
        res.render("admin/postagens", { postagens: postagens });
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao listar as postagens");
        res.redirect("/admin");
    });



})

router.get("/postagens/add",eAdmin, (req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render("admin/addpostagens", { categorias: categorias })
    }).catch((err) => {
        res.flash("error_msg", "Houve um erro ao salvar a postagen")
        res.render("/admin/postagens")
    });

})

//Rota salvando postagens no banco de dados
router.post("/postagens/nova",eAdmin, (req, res) => {
    var erros = [];

    if (req.body.categorias == "0") {
        erros.push({ text: "Categoria invalida, resgistre uma categoria" })
    }
    if (erros.length > 0) {
        req.flash("erro_msg", "Ocorreu um erro")
        res.render("/admin/addpostagens")
    } else {
        const novaPostagens = {
            titulo: req.body.titulo,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            slug: req.body.slug,
            categoria: req.body.categoria
        };

        new Postagens(novaPostagens).save().then(() => {
            req.flash("success_msg", "Postagem criada com sucesso!");
            res.redirect("/admin/postagens");
        }).catch((erro) => {
            req.flash("error_msg", "Ocorreu um erro ao adicionar a postagem");
            res.redirect("/admin/postagens");
        })

    }
})
//Editando postagens

router.get("/postagens/editar/:id",eAdmin, (req, res) => {
    Postagens.findOne({ _id: req.params.id }).lean().then((postagens) => {
        
        Categoria.findOne().then((categoria) => {
            res.render("admin/editpostagens", { postagens: postagens, categoria: categoria});
        }).catch((erro) => {
            req.flash("error_msg", "Ocorreu um erro ao carregar a categoria");
            res.redirect("/admin/postagens");
        })
    }).catch((erro) => {
        req.flash("error_msg", "Ocorreu ao carregar o formulario de edição");
        req.redirect("/admin/postagens");
    });
})

//Aplicando a edição de categorias

router.post("/postagens/editar",eAdmin, (req, res) => {
    //Chamando o model, procurando id que já foi passado no form

    Postagens.findOne({ _id: req.body.id }).then((postagens) => {

        postagens.titulo = req.body.titulo;
        postagens.slug = req.body.slug;
        postagens.descricao = req.body.descricao;
        postagens.conteudo = req.body.conteudo;
        postagens.categoria = req.body.categoria;

        //Validação da edição
        function verificaConteudo(conteudo){
            if(!conteudo && conteudo == null && conteudo == undefined){
                return false
            }
            return true;
        };

        if(verificaConteudo(postagens.titulo) == false){
            erros.push({text: "Titulo invalido"});
        }
        if(verificaConteudo(postagens.slug) ==false){
            erros.push({text: "Slug invalido"});
        }
        if(verificaConteudo(postagens.descricao) == false){
            erros.push({text: "Descrição invalida"});
        }
        if(verificaConteudo(postagens.conteudo) == false){
            erros.push({text: "Conteudo invalido"});
        }
        if(verificaConteudo(postagens.categoria) == false){
            erros.push({text: "Categoria invalido"});
        }else{
            postagens.save().then(() => {
                req.flash("success_msg", "Postagem editada com sucesso")
                res.redirect("/admin/postagens");
            }).catch((erro) => {
                console.log(erro);
                req.flash("error_msg", "Erro ao salvar postagem");
                res.redirect("/admin/postagens");
            })
        }

    }).catch((erro) => {
        console.log(erro);
        req.flash("error_msg", "Houve um erro ao editar a postagem");
        res.redirect("/admin/postagens");
    });

})

//Rota deletar postagem

router.post("/postagens/deletar",eAdmin, (req, res) => {
    Postagens.deleteOne({_id: req.body.id}).then(()=>{
        req.flash("success_msg", "Postagens deletada com sucesso!");
        res.redirect("/admin/postagens");
    }).catch((error)=>{
        req.flash("error_msg","Erro ao deletar postagem");
        res.redirect("/admin/postagens");
    })
})

module.exports = router;
const { validateProduct }=require("../validators");
const cloudinary = require("../config/cloudinary")
const Product = require("../models/product");


exports.createProduct = async (req, res) => {
    try {
        const { error } = validateProduct(req.body)
        if ( error ) res.json(error.details[0].message);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No images uploaded" });
        }
    
        const images = [];
        for (const file of req.files) {
            try {
                const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
                images.push({ img: result.secure_url });
            } catch (uploadError) {
                console.error("Image upload error:", uploadError);
                return res.status(500).json({ message: "Image upload failed", error: uploadError.message });
            }
        }
      
        // const images = req.files.map(file => ({ img: file.path }));
        const product = new Product({
            category: req.body.category,
            name: req.body.name,
            price: req.body.price,
            description: req.body.description,
            images: images,
            topSelling: req.body.topSelling,
            featured: req.body.featured,
        })

        const new_product_data = await product.save();
        res.json(new_product_data);
    } catch (error) {
        console.log({ message: error.message })
    }
}

exports.getAllProduct =  async (req, res ) => {
    try{
        const products = await Product.find().populate("category")
        res.json(products)
    }catch (error){
        console.log({ message: error.message })
    }
}
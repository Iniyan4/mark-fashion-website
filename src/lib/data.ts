export type Product = {id:string; name:string; category:string; description:string; image_url:string; price_from:number|null; active:boolean};
export type Selection = {key:string; product:Product; fabric:string; gsm:number; color:string; size:string; quantity:number; printing:string; notes:string};
export const fabrics=['Plain Polyester (PP)','Box Knit','Jacquard','Marc','Selina','Dot Knit'];
export const gsmOptions=[160,180,200,210,220];
export const starterProducts:Product[]=[
{id:'corporate',name:'Corporate / Store Tee',category:'T-Shirts',description:'Crew-neck branded apparel for teams, stores and events.',image_url:'/products/corporate.webp',price_from:null,active:true},
{id:'branded-polo',name:'Branded Polo',category:'Polos',description:'Classic polo collar, button placket and contrast finishing.',image_url:'/products/branded-polo.webp',price_from:null,active:true},
{id:'technical-polo',name:'Technical Polo',category:'Polos',description:'Technical polo with graphic treatment and sleeve details.',image_url:'/products/technical-polo.webp',price_from:null,active:true},
{id:'fashion-polo',name:'Retail / Fashion Polo',category:'Polos',description:'Clean, polished polo construction for branded collections.',image_url:'/products/fashion-polo.webp',price_from:null,active:true},
{id:'football-jersey',name:'Football Jersey',category:'Jerseys',description:'Football-style jersey with club and sponsor placement.',image_url:'/products/football-jersey.webp',price_from:null,active:true},
{id:'white-jersey',name:'White Sports Jersey',category:'Jerseys',description:'Clean white sports silhouette with club detailing.',image_url:'/products/white-jersey.webp',price_from:null,active:true},
{id:'branded-jersey',name:'Branded Jersey',category:'Jerseys',description:'Bold contrast custom teamwear for organizations.',image_url:'/products/branded-jersey.webp',price_from:null,active:true},
{id:'front-print',name:'Custom Front Graphic',category:'Custom Printing',description:'Large-format front graphics for campaigns and teams.',image_url:'/products/front-print.webp',price_from:null,active:true},
{id:'back-print',name:'Custom Back Branding',category:'Custom Printing',description:'Custom back graphics, logos and sponsor layouts.',image_url:'/products/back-print.webp',price_from:null,active:true}
];

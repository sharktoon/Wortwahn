/**
 * Created by daniel.krax on 07.03.2015.
 *
 * All the lovely hats, icons and stuff users can buy as rewards!
 */

// all hats data: id: { id, category, image, description, price }
var Hats = {};

var HatCategories = {
    "_SPECIAL_": { type: 'achievement', name: "(Belohnungen)", hats: [] },
    "Abstrakt": { type: 'normal', name: "Abstrakt", hats: [] },
    "Beschäftigung": { type: 'normal', name: "Beschäftigung", hats: [] },
    "Buntes": { type: 'normal', name: "Buntes", hats: [] },
    "Chips": { type: 'normal', name: "Chips", hats: [] },
    "Farben": { type: 'normal', name: "Farben", hats: [] },
    "Getränke": { type: 'normal', name: "Getränke", hats: [] },
    "Hut": { type: 'normal', name: "Hüte", hats: [] },
    "Tiere": { type: 'normal', name: "Tiere", hats: [] }
};

(function() {
    // easy to copy past base structure for hat shop
    var PureRewards = [
        { id:	"	b14	",	category:	"	_HIDDEN_	",	image:	"	pics/sm_667.gif	",	description: "	Hier wird's härter!	", price:	0	},
        { id:	"	MOD	",	category:	"	_SPECIAL_	",	image:	"	states/icon_vip.png	",	description: "	Eine Belohnung für die ehrenamtlichen Einsatz für ein tolles Spiel!	", price:	0	},
        { id:	"	&01	",	category:	"	_SPECIAL_	",	image:	"	smileys/smiley_bottom-right.gif	",	description: "	Belohnung für die Besten am Ende einer Saison!	", price:	0	},
        { id:	"	&02	",	category:	"	_SPECIAL_	",	image:	"	smileys/smiley_headline.gif	",	description: "	Dieses Symbol bekommen nur die Besten der Besten!	", price:	0	},
        { id:	"	NPF	",	category:	"	_SPECIAL_	",	image:	"	smileys/ft_freetext_happy_f.gif	",	description: "	Du bist eine tolle Frau!	", price:	0	},
        { id:	"	NPM	",	category:	"	_SPECIAL_	",	image:	"	smileys/ft_freetext_happy_m.gif	",	description: "	Du bist ein toller Mann!	", price:	0	},
        { id:	"	&03	",	category:	"	_SPECIAL_	",	image:	"	smileys/ft_freetext_happy_y.gif	",	description: "	Du bist hier immer willkommen!	", price:	0	},
        { id:	"	&00	",	category:	"	_SPECIAL_	",	image:	"	objects/side_sunflowerpot.png	",	description: "	Die Belohnung für das Erreichen von 1.000 Punkten in der Saison März.	", price:	0	},
        { id:	"	b18	",	category:	"	_SPECIAL_	",	image:	"	pics/sm_cardsB_03b.b.my_11.h_27.gif	",	description: "	Die Belohnung für das Erreichen von 1.000 Punkten in der Saison April.	", price:	0	},
        { id:	"	&04	",	category:	"	_SPECIAL_	",	image:	"	pics/sm_macguffin2012-item_12.png	",	description: "	Die Belohnung für das Erreichen von 1.000 Punkten in der Saison Mai.	", price:	0	},
        { id:	"	&05	",	category:	"	_SPECIAL_	",	image:	"	pics/sm_macguffin2012-item_15.png	",	description: "	Die Belohnung für das Erreichen von 1.000 Punkten in der Saison Juni.	", price:	0	},
        { id:	"	&10	",	category:	"	_SPECIAL_	",	image:	"	pics/sm_abo_12-07_love_full-heart-bg.png	",	description: "	Die Belohnung für das Erreichen von 1.000 Punkten in der Saison Juli.	", price:	0	},
        { id:	"	&06	",	category:	"	_SPECIAL_	",	image:	"	pics/sm_macguffin2012-item_08.png	",	description: "	Die Belohnung für das Erreichen von 1.000 Punkten in der Saison August.	", price:	0	},
        { id:	"	&07	",	category:	"	_SPECIAL_	",	image:	"	pics/sm_abo_11-10_frankenstein.gif	",	description: "	Die Belohnung für das Erreichen von 1.000 Punkten in der Saison September.	", price:	0	},
        { id:	"	&08	",	category:	"	_SPECIAL_	",	image:	"	pics/sm_abo_14-02_hockey.gif	",	description: "	Die Belohnung für das Erreichen von 1.000 Punkten in der Saison Januar.	", price:	0	},
        { id:	"	a00	",	category:	"	Abstrakt	",	image:	"	chips/s_1.b.png	",	description: "	Deine Lieblingskarten sind Herz.	", price:	25	},
        { id:	"	a01	",	category:	"	Abstrakt	",	image:	"	chips/s_2.b.png	",	description: "	Deine Lieblingskarten sind Kreuz.	", price:	25	},
        { id:	"	a02	",	category:	"	Abstrakt	",	image:	"	chips/s_3.b.png	",	description: "	Deine Lieblingskarten sind Karo.	", price:	25	},
        { id:	"	a03	",	category:	"	Abstrakt	",	image:	"	chips/s_4.b.png	",	description: "	Deine Lieblingskarten sind Pik.	", price:	25	},
        { id:	"	a04	",	category:	"	Abstrakt	",	image:	"	objects/email_icon.gif	",	description: "	Ein Symbol für absolut coole Brieffreunde!	", price:	100	},
        { id:	"	a05	",	category:	"	Abstrakt	",	image:	"	objects/fackel.gif	",	description: "	Du kannst eine Fackel hoch halten - für deine Überzeugung!	", price:	200	},
        { id:	"	b17	",	category:	"	Abstrakt	",	image:	"	pics/sm_abo-wlcm2012_UNKNOWN.gif	",	description: "	Du weißt auch nicht so recht, was das soll. Wie geht das schon wieder?	", price:	1000	},
        { id:	"	b25	",	category:	"	Abstrakt	",	image:	"	pics/smileywars/chat_toggle_sticky-enabled.png	",	description: "	Wichtig ist nur, dass du nicht aus dem Bildschirm fällst!	", price:	2500	},
        { id:	"	a06	",	category:	"	Abstrakt	",	image:	"	objects/ft_ktmh_whois_key.png	",	description: "	Mit diesem Schlüssel kommst du überall rein. Wenn er passt.	", price:	5000	},
        { id:	"	b07	",	category:	"	Abstrakt	",	image:	"	pics/icon_magnifying_glass.my_2.gif	",	description: "	Hiermit kannst du auch das Kleingedruckte lesen!	", price:	7500	},
        { id:	"	a07	",	category:	"	Abstrakt	",	image:	"	objects/icon_bulb.png	",	description: "	Deine Argumention ist damit besonders einleuchtend!	", price:	10000	},
        { id:	"	b10	",	category:	"	Abstrakt	",	image:	"	pics/padlock.gif	",	description: "	Wartest du darauf aufgeschlossen zu werden, oder bist du einfach nur verschlossen?	", price:	25000	},
        { id:	"	a08	",	category:	"	Beschäftigung	",	image:	"	states/away.png	",	description: "	Du kannst anderen Leuten zeigen, dass du Wortspiele sogar im Schlaf beherrscht!	", price:	50	},
        { id:	"	b08	",	category:	"	Beschäftigung	",	image:	"	pics/mumie.gif	",	description: "	Damit kannst du allen zeigen, dass du auch richtig gut in Knuddelonia bist!	", price:	500	},
        { id:	"	a09	",	category:	"	Beschäftigung	",	image:	"	objects/below_armchair.png	",	description: "	Auf einem Sofa kannst du besonders gut entspannen!	", price:	1000	},
        { id:	"	b13	",	category:	"	Beschäftigung	",	image:	"	pics/sm_14.gif	",	description: "	Rebel without a cause !	", price:	2500	},
        { id:	"	a10	",	category:	"	Beschäftigung	",	image:	"	objects/side_soccerball.png	",	description: "	Jeder echte Fußballfan hat das!	", price:	5000	},
        { id:	"	b23	",	category:	"	Beschäftigung	",	image:	"	pics/smileywars/icons_skills_attackdistance-1.png	",	description: "	Du bist ein begeistert vom Box-Sport!	", price:	7500	},
        { id:	"	a11	",	category:	"	Beschäftigung	",	image:	"	objects/side_totempole2.png	",	description: "	Damit kann man winken!	", price:	10000	},
        { id:	"	b16	",	category:	"	Beschäftigung	",	image:	"	pics/sm_abo_13-04_nerd.gif	",	description: "	Die Brille verschafft dir den Durchblick!	", price:	25000	},
        { id:	"	a12	",	category:	"	Beschäftigung	",	image:	"	smileys/smiley_bottom-left.gif	",	description: "	Für Leute die nicht gerne alleine sind!	", price:	50000	},
        { id:	"	b26	",	category:	"	Beschäftigung	",	image:	"	pics/sm_witch.gif	",	description: "	So ein Besen kann vielfältig verwendet werden. Von der richtigen Person!	", price:	75000	},
        { id:	"	a13	",	category:	"	Beschäftigung	",	image:	"	objects/devilbomb_a.b.gif	",	description: "	Achtung: Gleich wird etwas explodieren. Nur noch einen Moment!	", price:	100000	},
        { id:	"	a14	",	category:	"	Beschäftigung	",	image:	"	smileys/ft_statistik.png	",	description: "	Du weißt immer wo's lang geht!	", price:	250000	},
        { id:	"	a15	",	category:	"	Beschäftigung	",	image:	"	objects/earth_rotation.gif	",	description: "	Hiermit kannst du anderen zeigen, dass du schon die ganze Welt bereist habest.	", price:	500000	},
        { id:	"	a16	",	category:	"	Beschäftigung	",	image:	"	objects/message_sold.png	",	description: "	Damit kannst du anderen zeigen, wie reich du bist.	", price:	1000000	},
        { id:	"	a17	",	category:	"	Beschäftigung	",	image:	"	objects/safe_open.gif	",	description: "	Du bist WIRKLICH reich.	", price:	2500000	},
        { id:	"	b21	",	category:	"	Buntes	",	image:	"	pics/snowfight_catapult.png	",	description: "	Das Torten-Katapult!	", price:	500	},
        { id:	"	b09	",	category:	"	Buntes	",	image:	"	pics/nose.gif	",	description: "	Gesundheit!	", price:	1000	},
        { id:	"	b11	",	category:	"	Buntes	",	image:	"	pics/present_2.gif	",	description: "	Du bist ein echtes Geschenk vom Himmel!	", price:	2500	},
        { id:	"	b20	",	category:	"	Buntes	",	image:	"	pics/snowfight_cannon.png	",	description: "	Hier wird scharf geschossen!	", price:	5000	},
        { id:	"	b24	",	category:	"	Buntes	",	image:	"	pics/smileywars/icons_skills_sightdistance.png	",	description: "	Damit behälst du alle im Blick!	", price:	7500	},
        { id:	"	b12	",	category:	"	Buntes	",	image:	"	pics/quietscheente.png	",	description: "	Purer Spaß beim Baden!	", price:	10000	},
        { id:	"	b15	",	category:	"	Buntes	",	image:	"	pics/sm_abo_11-04_break.gif	",	description: "	Du hast noch ein Zeitungsabo!	", price:	25000	},
        { id:	"	b19	",	category:	"	Buntes	",	image:	"	pics/sm_creep.b.gif	",	description: "	Grün ist einfach die beste Farbe!	", price:	50000	},
        { id:	"	c04	",	category:	"	Buntes	",	image:	"	pics/sm_abo_14-07_hulahoop.gif	",	description: "	Damit zeigst du allen wie toll ein Kreis sein kann!	", price:	100000	},
        { id:	"	a18	",	category:	"	Chips	",	image:	"	chips/chip_1.png	",	description: "	Der Einstieg in jedes Spiel! Ein kleiner Einsatz!	", price:	1	},
        { id:	"	a19	",	category:	"	Chips	",	image:	"	chips/chip_5.png	",	description: "	Der Einsatz für den anspruchsvollen Einsteiger.	", price:	5	},
        { id:	"	a20	",	category:	"	Chips	",	image:	"	chips/chip_10.png	",	description: "	Ein guter Einsatz. Jetzt wird's heiß!	", price:	10	},
        { id:	"	a21	",	category:	"	Chips	",	image:	"	chips/chip_20.png	",	description: "	Hier geht's richtig zur Sache!	", price:	20	},
        { id:	"	a22	",	category:	"	Chips	",	image:	"	chips/chip_25.png	",	description: "	Du spielst schon richtig mit!	", price:	25	},
        { id:	"	a23	",	category:	"	Chips	",	image:	"	chips/chip_100.png	",	description: "	Das sind schon einige Punkte!	", price:	100	},
        { id:	"	a24	",	category:	"	Chips	",	image:	"	chips/chip_500.png	",	description: "	Das könnte teuer werden!	", price:	500	},
        { id:	"	a25	",	category:	"	Chips	",	image:	"	chips/chip_1M.png	",	description: "	Da spielt jemand mit richtig viel!	", price:	1000000	},
        { id:	"	a26	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_01.gif	",	description: "	Ein Lächeln - gelb.	", price:	10	},
        { id:	"	a27	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_02.gif	",	description: "	Ein Lächeln - weiß.	", price:	150	},
        { id:	"	a28	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_03.gif	",	description: "	Ein Lächeln - schwarz.	", price:	150	},
        { id:	"	a29	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_08.gif	",	description: "	Ein Lächeln - grün.	", price:	250	},
        { id:	"	a30	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_10.gif	",	description: "	Ein Lächeln - blau.	", price:	250	},
        { id:	"	a32	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_05.gif	",	description: "	Ein Lächeln - rot.	", price:	500	},
        { id:	"	a39	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_14.gif	",	description: "	Ein Lächeln - braun.	", price:	500	},
        { id:	"	a33	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_06.gif	",	description: "	Ein Lächeln - ocker.	", price:	1000	},
        { id:	"	a34	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_07.gif	",	description: "	Ein Lächeln - hellgrün.	", price:	1000	},
        { id:	"	a35	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_11.gif	",	description: "	Ein Lächeln - dunkelblau.	", price:	2500	},
        { id:	"	a36	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_13.gif	",	description: "	Ein Lächeln - lila.	", price:	2500	},
        { id:	"	a37	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_09.gif	",	description: "	Ein Lächeln - türkis.	", price:	5000	},
        { id:	"	a38	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_12.gif	",	description: "	Ein Lächeln - purpur.	", price:	10000	},
        { id:	"	a31	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_04.gif	",	description: "	Ein Lächeln - rosa.	", price:	50000	},
        { id:	"	a40	",	category:	"	Farben	",	image:	"	smileys/sm_welcome-2011_basic_15.gif	",	description: "	Ein Lächeln - mit Glitzer!	", price:	100000	},
        { id:	"	a41	",	category:	"	Getränke	",	image:	"	objects/ft_anstossen_profil_03-tea.png	",	description: "	Gemütlichkeit siegt!	", price:	50	},
        { id:	"	a42	",	category:	"	Getränke	",	image:	"	objects/ft_anstossen_profil_02-beer.png	",	description: "	Alles in Maßen genießen.	", price:	100	},
        { id:	"	a43	",	category:	"	Getränke	",	image:	"	objects/ft_anstossen_profil_05-juice.png	",	description: "	Einfach nur erfrischend!	", price:	200	},
        { id:	"	a44	",	category:	"	Getränke	",	image:	"	objects/ft_anstossen_profil_04-cocktail.png	",	description: "	Wer kann bei so einer Farbe schon nein sagen?	", price:	500	},
        { id:	"	a45	",	category:	"	Getränke	",	image:	"	objects/ft_anstossen_profil_01-sekt.png	",	description: "	Nur vielleicht mit Alkohol.	", price:	1000	},
        { id:	"	a48	",	category:	"	Getränke	",	image:	"	objects/ft_anstossen_profil_07-bubble-tea.png	",	description: "	Der Strohhalm macht alles noch viel besser!	", price:	2500	},
        { id:	"	a47	",	category:	"	Getränke	",	image:	"	objects/ft_anstossen_profil_06-cola.png	",	description: "	Genuß - aber nur von der richtigen Marke!	", price:	5000	},
        { id:	"	a46	",	category:	"	Getränke	",	image:	"	objects/creepy-cocktail.gif	",	description: "	Dieses Getränke ist nur für Leute die einiges verdauen können.	", price:	10000	},
        { id:	"	a51	",	category:	"	Hut	",	image:	"	objects/hut_01.png	",	description: "	Let's get the party started!	", price:	1000	},
        { id:	"	a52	",	category:	"	Hut	",	image:	"	objects/hut_02.png	",	description: "	Let's get the party started!	", price:	1000	},
        { id:	"	a53	",	category:	"	Hut	",	image:	"	objects/hut_03.png	",	description: "	Let's get the party started!	", price:	1000	},
        { id:	"	a49	",	category:	"	Hut	",	image:	"	objects/cowboyhut.png	",	description: "	Ein echter Hut für Leute die gerne im Wilden Westen sind!	", price:	2500	},
        { id:	"	a50	",	category:	"	Hut	",	image:	"	objects/hat_cowboyorange.png	",	description: "	Ein tod-schicker Hut.	", price:	5000	},
        { id:	"	b22	",	category:	"	Hut	",	image:	"	pics/smileywars/icon_skills_king_001.png	",	description: "	Damit sitzt du schon fast auf einem Thron.	", price:	75000	},
        { id:	"	a54	",	category:	"	Tiere	",	image:	"	states/newUser.png	",	description: "	Eine Biene. Es erlaubt dir 100% Genuß bei Süßigkeiten.	", price:	50	},
        { id:	"	a55	",	category:	"	Tiere	",	image:	"	states/schaf.png	",	description: "	Der Wolf im Schafspelz. Hiermit hast du 100% Genuß beim Anschauen von Filmen.	", price:	200	},
        { id:	"	b01	",	category:	"	Tiere	",	image:	"	pics/fisch.gif	",	description: "	Damit fühlst du dich wohl wie ein Fisch in Wasser!	", price:	500	},
        { id:	"	b04	",	category:	"	Tiere	",	image:	"	pics/sm_abo_14-03_costumes_frog.png	",	description: "	Quaak!	", price:	1000	},
        { id:	"	c03	",	category:	"	Tiere	",	image:	"	pics/sm_abo_14-03_costumes_fly.png	",	description: "	Kein Einhorn kann ohne dich existieren!	", price:	2500	},
        { id:	"	c01	",	category:	"	Tiere	",	image:	"	pics/sm_abo_14-03_costumes_bee.png	",	description: "	Die Königin unter den Insekten. Oder noch besser?	", price:	5000	},
        { id:	"	c02	",	category:	"	Tiere	",	image:	"	pics/sm_abo_14-03_costumes_cow.png	",	description: "	Niemand ist so nützlich wie du!	", price:	7500	},
        { id:	"	b06	",	category:	"	Tiere	",	image:	"	pics/sm_abo_14-03_costumes_tiger.png	",	description: "	Nur für Leute mit der richtigen Tankfüllung!	", price:	10000	},
        { id:	"	b05	",	category:	"	Tiere	",	image:	"	pics/sm_abo_14-03_costumes_panda.png	",	description: "	Damit zeigst du dass du so richtig gemütlich, und kuschelig bist!	", price:	25000	},
        { id:	"	a56	",	category:	"	Tiere	",	image:	"	objects/side_turd.png	",	description: "	Nicht alles an Tieren ist toll - nur für echte Sammler.	", price:	50000	},
        { id:	"	b02	",	category:	"	Tiere	",	image:	"	pics/fledermaus.gif	",	description: "	Nachtaktiv!	", price:	75000	},
        { id:	"	b03	",	category:	"	Tiere	",	image:	"	pics/hai.gif	",	description: "	Der Gejagte? Oder der Jäger?	", price:	100000	},
        { id:	"	a57	",	category:	"	Tiere	",	image:	"	objects/piggyicon.png	",	description: "	Echte Glückskekse brauchen so etwas!	", price:	500000	},
    ];

    for (var i = 0; i < PureRewards.length; ++i) {
        try {
            var rawHat = PureRewards[i];
            var hat = {
                id: rawHat.id.trim(),
                category: rawHat.category.trim(),
                image: rawHat.image.trim(),
                description: rawHat.description.trim(),
                price: rawHat.price
            };

            Hats[hat.id] = hat;
            if (HatCategories.hasOwnProperty(hat.category)) {
                HatCategories[hat.category].hats.push(hat.id);
            }
        } catch (error) {
            // too bad - ignore bad parse data
        }
    }
})();

var degreeReportModel = function(src) {

    var list = [{
        secCount: "",
        bucketTitle:"",
        bucketId: "",
        bucketCount: "",
        levelTitle: "",
        levelId: "",
        secBucketTitle: "",
    }];

    src.forEach(function(obj) {
        list.push({
            secCount: obj.stotal,
            bucketTitle: obj.bucketTitle,
            bucketId: obj.bucket_id,
            bucketCount: obj.ptotal,
            levelTitle: obj.levelTitle,
            levelId: obj.level_id,
            secBucketTitle: obj.secBucketTitle, 
        })
    });

    let modifiedList = list.map(function(item, index) {
        if ( checkListLevel(item.levelId, index, list) ) {
            return {
                secCount: item.secCount,
                bucketTitle: item.bucketTitle,
                bucketId: item.bucketId,
                bucketCount: item.bucketCount,
                levelTitle: null,
                levelId: item.levelId,
                secBucketTitle: item.secBucketTitle
            };
        } else {
            return {
                secCount: item.secCount,
                bucketTitle: item.bucketTitle,
                bucketId: item.bucketId,
                bucketCount: item.bucketCount,
                levelTitle: item.levelTitle,
                levelId: item.levelId,
                secBucketTitle: item.secBucketTitle
            };
        }
    });

    modifiedList = modifiedList.map(function(item, index) {
        if ( checkList(item.bucketId, item.levelId, index, list) ) {
            return {
                secCount: item.secCount,
                bucketTitle: null,
                bucketId: item.bucketId,
                bucketCount: null,
                levelTitle: item.levelTitle,
                levelId: item.levelId,
                secBucketTitle: item.secBucketTitle
            };
        } else {
            return {
                secCount: item.secCount,
                bucketTitle: item.bucketTitle,
                bucketId: item.bucketId,
                bucketCount: item.bucketCount,
                levelTitle: item.levelTitle,
                levelId: item.levelId,
                secBucketTitle: item.secBucketTitle
            };
        }
    });

    function checkListLevel(levelId, index, originalList) {

        let first = originalList.findIndex(function(item) {
            return item.levelId == levelId;
        });
        if (first == index) {
            return false;
        } else {
            return true;
        }
    }

    function checkList(bucketId, levelId, index, originalList) {

        let first = originalList.findIndex(function(item) {
            return item.bucketId == bucketId && item.levelId == levelId;
        });
        if (first == index) {
            return false;
        } else {
            return true;
        }
    }

    return modifiedList.slice(1);

    // let titleObject = {}
    // for (let item of list) {
    //     let { bucketTitle, levelTitle } = item;
    //     if (bucketTitle && levelTitle) {
    //         if (titleObject.hasOwnProperty(bucketTitle) && titleObject[bucketTitle] === levelTitle) {
    //             item.bucketTitle = null;
    //             item.levelTitle = null;
    //             item.bucketCount = null;
    //         }
    //         titleObject[bucketTitle] = levelTitle
    //     }
    // }

    // return list.slice(1);
}

module.exports = degreeReportModel;
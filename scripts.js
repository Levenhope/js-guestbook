(function () {
    function createCommentTemplate(id, author, message, pubDate) {
        let dateObj = pubDate instanceof Date ? pubDate : new Date(pubDate);
        let time = dateObj.toLocaleString('ru-RU', {hour: '2-digit', minute: '2-digit'});
        let date = dateObj.toLocaleString('ru-RU', {day: 'numeric', month: 'numeric', year: 'numeric'});

        return`<article class="card mb-2" id="${id}">
            <div class="card-body">
                <h3 class="cart-title">${author}</h3>
                <p>${message}</p>
            </div>
            <div class="card-footer">
                <small>Pub date: ${time} ${date}</small>
                <button class="comment-button btn btn-secondary btn-sm">comments this</button>
                <button class="edit-button btn btn-primary btn-sm">edit this</button>
                <button class="delete-button btn btn-danger btn-sm">delete this</button>
            </div>
        </article>`;
    }

    function validateField(field, condition) {
        if (!condition) {
            $(field).addClass('is-invalid');
        } else {
            $(field).removeClass('is-invalid');
        }
    }

    function runChecks(field) {
        validateField(field, $(field).val().length);
    }

    function validateForm(form) {
        $('.form-control', $(form)).each(function(index, field) {
            runChecks(field);
        });

        return ($('.is-invalid', $(form)).length < 1);
    }

    function initAlert() {
        let alertElement = $('<div>').addClass('alert alert-success alert-dismissible')
            .append($('<button type="button" class="close" data-dismiss="alert">').append("&times;"))
            .append('thank for your comment');

        $('body').append(alertElement);
        alertElement.alert();

        window.setTimeout(function() { alertElement.alert("close") }, 5000);
    }

    function initForm(selector) {
        let form = $(selector);

        form.on('focusout', function(e) {
            let field = e.target;
            if (field.tagName !== 'BUTTON') runChecks(field);

        });

        form.on('submit', function(e) {
            e.preventDefault();

            if (validateForm(form)) {
                let id = Math.random().toString(36).substr(2, 9);
                let author = $('#name', form).val();
                let message = $('#message', form).val();
                let pubDate = new Date();
                let newComment = createCommentTemplate(id, author, message, pubDate);

                // id - уникальный id записи
                // author {string} - имя автора записи
                // message {string} - текст записи
                // pubDate {Date} - дата создания записи
                // editDate {Date} - дата редактирования записи
                // comments {array} - массив комментариев к записи
                let record = {
                    id,
                    author,
                    message,
                    pubDate,
                    editDate: pubDate,
                    comments: []
                };

                DB.addRecords(record);

                initAlert();

                $('#comments-list').append(newComment);

                $('.form-control', form).each(function(index, field) { $(field).val(''); });
            }
        });
    }

    function initCommentsList() {
        let records = DB.getAllRecords();

        records.reverse().forEach(function (record) {
            let newComment = createCommentTemplate(record.id, record.author, record.message, record.pubDate);
            $('#comments-list').append(newComment);
        });
    }

    function initDeleteButtons() {
        $(document).on('click', '.delete-button', function() {
            let card = $(this).closest('.card');

            DB.deleteRecord(card.attr('id'));
            card.remove();
        });
    }

    initCommentsList();
    initDeleteButtons();

    initForm('#add-comments');

}());


